"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  clearBoothKioskSession,
  getBoothKioskSession,
  requireBoothKioskUnlocked,
  setBoothKioskUnlocked,
} from "@/lib/booth-kiosk-session";
import { isPrismaSchemaDriftError, prisma } from "@/lib/prisma";
import { createBooking } from "@/lib/actions";
import { visitorRegistrationSchema } from "@/lib/validations";
import { pickVisitorTicketType } from "@/lib/visitor-pass";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";

export type KioskCheckInResult =
  | { error: string }
  | {
      success: true;
      alreadyCheckedIn: boolean;
      visitor: {
        name: string;
        email: string;
        company: string | null;
        designation: string | null;
        bookingNumber: string;
        checkedInAt: string | null;
      };
    };

export type KioskRegisterResult =
  | { error: string }
  | { requiresPayment: true; checkoutUrl: string }
  | {
      success: true;
      alreadyRegistered: boolean;
      bookingNumber: string;
      qrDataUrl: string;
      passLabel: string;
      visitor: {
        name: string;
        email: string;
        company: string | null;
        designation: string | null;
      };
    };

type TicketPayload = {
  type?: string;
  booking?: string;
  event?: string;
};

const eventKioskInclude = {
  venue: { select: { name: true, city: true } },
  ticketTypes: {
    where: { isActive: true },
    select: { id: true, name: true, price: true, quantity: true, sold: true, tier: true },
  },
} as const;

async function getEventByKioskKey(slug: string) {
  return prisma.event.findFirst({
    where: { slug, status: "PUBLISHED", boothKioskEnabled: true },
    include: eventKioskInclude,
  });
}

export async function checkBoothKioskSession(eventSlug: string, eventId: string) {
  try {
    return await getBoothKioskSession(eventSlug, eventId);
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { unlocked: false as const, error: "On-site registration is not available yet." };
    }
    throw error;
  }
}

export async function unlockBoothKiosk(eventSlug: string, eventId: string, password: string) {
  if (!password.trim()) return { error: "Password is required" };

  try {
    const event = await prisma.event.findFirst({
      where: { id: eventId, slug: eventSlug, status: "PUBLISHED", boothKioskEnabled: true },
      select: { id: true, boothKioskPasswordHash: true },
    });
    if (!event) return { error: "This on-site link is not active." };
    if (!event.boothKioskPasswordHash) {
      return { error: "Password has not been set yet. Contact the event organizer." };
    }

    const valid = await bcrypt.compare(password, event.boothKioskPasswordHash);
    if (!valid) return { error: "Incorrect password" };

    await setBoothKioskUnlocked(eventSlug, event.id);
    return { success: true as const };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "On-site registration is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

export async function lockBoothKiosk(eventSlug: string) {
  await clearBoothKioskSession(eventSlug);
  return { success: true as const };
}

export async function registerAtKiosk(
  eventSlug: string,
  eventId: string,
  data: {
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    attendeeCompany: string;
    attendeeDesignation: string;
    attendeeSector: string;
  }
): Promise<KioskRegisterResult> {
  try {
    const sessionCheck = await requireBoothKioskUnlocked(eventSlug, eventId);
    if (!sessionCheck.ok) return { error: sessionCheck.error };

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId, isActive: true },
    });

    const visitorTicket = pickVisitorTicketType(
      ticketTypes.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price.toNumber(),
      }))
    );

    if (!visitorTicket?.id) {
      return { error: "Visitor registration is not available for this event." };
    }

    const parsed = visitorRegistrationSchema.safeParse({
      eventId,
      ticketTypeId: visitorTicket.id,
      ...data,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid registration details" };
    }

    const bookingResult = await createBooking({
      eventId,
      items: [{ ticketTypeId: visitorTicket.id, quantity: 1 }],
      attendeeName: parsed.data.attendeeName,
      attendeeEmail: parsed.data.attendeeEmail,
      attendeePhone: parsed.data.attendeePhone,
      attendeeCompany: parsed.data.attendeeCompany,
      attendeeDesignation: parsed.data.attendeeDesignation,
      attendeeSector: parsed.data.attendeeSector,
    });

    const passLabel = getPassBadgeLabel(
      visitorTicket.name,
      ticketTypes.find((t) => t.id === visitorTicket.id)?.tier
    );

    if (bookingResult.error) {
      if (bookingResult.alreadyRegistered && bookingResult.bookingNumber) {
        const booking = await prisma.booking.findFirst({
          where: {
            bookingNumber: bookingResult.bookingNumber,
            eventId,
            status: "CONFIRMED",
          },
        });
        if (!booking) {
          return {
            error: "This email is already registered. Complete payment or check email for the pass.",
          };
        }

        const qrDataUrl = await generateQRCodeDataUrl(
          getTicketQRPayload(booking.bookingNumber, eventId)
        );

        return {
          success: true,
          alreadyRegistered: true,
          bookingNumber: booking.bookingNumber,
          qrDataUrl,
          passLabel,
          visitor: {
            name: booking.attendeeName,
            email: booking.attendeeEmail,
            company: booking.attendeeCompany,
            designation: booking.attendeeDesignation,
          },
        };
      }
      return { error: bookingResult.error };
    }

    if (bookingResult.checkoutUrl) {
      return { requiresPayment: true, checkoutUrl: bookingResult.checkoutUrl };
    }

    if (!bookingResult.bookingNumber) {
      return { error: "Registration could not be completed." };
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber: bookingResult.bookingNumber,
        eventId,
        status: "CONFIRMED",
      },
    });

    if (!booking) {
      return { error: "Registration could not be completed." };
    }

    const qrDataUrl = await generateQRCodeDataUrl(
      getTicketQRPayload(booking.bookingNumber, eventId)
    );

    revalidatePath("/admin");

    return {
      success: true,
      alreadyRegistered: false,
      bookingNumber: booking.bookingNumber,
      qrDataUrl,
      passLabel,
      visitor: {
        name: booking.attendeeName,
        email: booking.attendeeEmail,
        company: booking.attendeeCompany,
        designation: booking.attendeeDesignation,
      },
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "On-site registration is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

function parseVisitorQr(qrData: string): { bookingNumber?: string; eventId?: string } {
  const trimmed = qrData.trim();
  try {
    const payload = JSON.parse(trimmed) as TicketPayload;
    if (payload.type === "axar-ticket" || payload.type === "akshar-ticket") {
      return { bookingNumber: payload.booking, eventId: payload.event };
    }
  } catch {
    // fall through to plain booking number
  }
  return { bookingNumber: trimmed };
}

export async function checkInAtKiosk(
  eventSlug: string,
  eventId: string,
  qrData: string
): Promise<KioskCheckInResult> {
  const trimmed = qrData.trim();
  if (!trimmed) return { error: "No QR code data provided" };

  try {
    const sessionCheck = await requireBoothKioskUnlocked(eventSlug, eventId);
    if (!sessionCheck.ok) return { error: sessionCheck.error };

    const { bookingNumber, eventId: payloadEventId } = parseVisitorQr(trimmed);
    if (!bookingNumber) return { error: "Invalid visitor pass" };
    if (payloadEventId && payloadEventId !== eventId) {
      return { error: "This pass is for a different event" };
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber,
        eventId,
        status: "CONFIRMED",
      },
      include: { attendance: true },
    });

    if (!booking) {
      return { error: "Visitor pass not found or not confirmed for this event" };
    }

    if (booking.checkedIn || booking.attendance) {
      const checkedInAt = booking.checkedInAt ?? booking.attendance?.checkedInAt;
      return {
        success: true,
        alreadyCheckedIn: true,
        visitor: {
          name: booking.attendeeName,
          email: booking.attendeeEmail,
          company: booking.attendeeCompany,
          designation: booking.attendeeDesignation,
          bookingNumber: booking.bookingNumber,
          checkedInAt: checkedInAt?.toISOString() ?? null,
        },
      };
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { checkedIn: true, checkedInAt: now },
      }),
      prisma.attendance.create({
        data: { bookingId: booking.id, deviceInfo: "onsite-kiosk" },
      }),
    ]);

    revalidatePath("/admin");

    return {
      success: true,
      alreadyCheckedIn: false,
      visitor: {
        name: booking.attendeeName,
        email: booking.attendeeEmail,
        company: booking.attendeeCompany,
        designation: booking.attendeeDesignation,
        bookingNumber: booking.bookingNumber,
        checkedInAt: now.toISOString(),
      },
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "On-site check-in is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

export async function configureEventBoothKiosk(
  eventId: string,
  data: { enabled: boolean; password?: string }
) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true, boothKioskPasswordHash: true },
    });
    if (!event) return { error: "Event not found" };

    const password = data.password?.trim();
    const update: {
      boothKioskEnabled: boolean;
      boothKioskPasswordHash?: string;
    } = {
      boothKioskEnabled: data.enabled,
    };

    if (password) {
      update.boothKioskPasswordHash = await bcrypt.hash(password, 12);
    } else if (data.enabled && !event.boothKioskPasswordHash) {
      return { error: "Set a password before enabling the on-site link" };
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: update,
      select: { slug: true, boothKioskEnabled: true },
    });

    revalidatePath("/admin");
    return {
      success: true as const,
      slug: updated.slug,
      enabled: updated.boothKioskEnabled,
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "On-site registration is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

export async function loadEventForBoothKioskPage(slug: string) {
  return getEventByKioskKey(slug);
}
