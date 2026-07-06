"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  clearBoothKioskSession,
  hasValidBoothKioskSession,
  setBoothKioskSession,
} from "@/lib/booth-kiosk-session";
import { isPrismaSchemaDriftError, prisma } from "@/lib/prisma";
import { createBooking } from "@/lib/actions";
import { visitorRegistrationSchema } from "@/lib/validations";
import { pickVisitorTicketType } from "@/lib/visitor-pass";

export type BoothScanResult =
  | { error: string }
  | {
      success: true;
      alreadyScanned: boolean;
      visitor: {
        name: string;
        email: string;
        company: string | null;
        designation: string | null;
        bookingNumber: string;
        scannedAt: string;
      };
    };

type TicketPayload = {
  type?: string;
  booking?: string;
  event?: string;
};

async function getKioskExhibitorByToken(token: string) {
  return prisma.eventExhibitor.findFirst({
    where: { boothKioskToken: token, boothKioskEnabled: true },
    include: {
      exhibitor: { select: { companyName: true } },
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venue: { select: { name: true, city: true } },
        },
      },
    },
  });
}

export async function checkBoothKioskSession(token: string) {
  try {
    const entry = await prisma.eventExhibitor.findFirst({
      where: { boothKioskToken: token, boothKioskEnabled: true },
      select: { id: true },
    });
    if (!entry) return { unlocked: false };
    const unlocked = await hasValidBoothKioskSession(token, entry.id);
    return { unlocked };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { unlocked: false, error: "Booth visitor tracking is not available yet." };
    }
    throw error;
  }
}

export async function unlockBoothKiosk(token: string, password: string) {
  if (!password.trim()) return { error: "Password is required" };

  try {
    const entry = await getKioskExhibitorByToken(token);
    if (!entry) return { error: "This booth kiosk link is not active." };
    if (!entry.boothKioskPasswordHash) {
      return { error: "Booth kiosk password has not been set yet. Contact the event organizer." };
    }

    const valid = await bcrypt.compare(password, entry.boothKioskPasswordHash);
    if (!valid) return { error: "Incorrect password" };

    await setBoothKioskSession(token, entry.id);
    return { success: true as const };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "Booth visitor tracking is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

export async function lockBoothKiosk(token: string) {
  await clearBoothKioskSession(token);
  return { success: true as const };
}

export type BoothRegisterResult =
  | { error: string }
  | { requiresPayment: true; checkoutUrl: string }
  | {
      success: true;
      alreadyRegistered: boolean;
      bookingNumber: string;
      visitor: {
        name: string;
        email: string;
        company: string | null;
        designation: string | null;
        bookingNumber: string;
        scannedAt: string;
      };
    };

async function recordBoothVisitForBooking(
  entry: { id: string; eventId: string },
  booking: {
    id: string;
    bookingNumber: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeeCompany: string | null;
    attendeeDesignation: string | null;
  }
) {
  const existing = await prisma.boothVisit.findUnique({
    where: {
      eventExhibitorId_bookingId: {
        eventExhibitorId: entry.id,
        bookingId: booking.id,
      },
    },
  });

  if (existing) {
    return {
      alreadyScanned: true,
      visit: existing,
    };
  }

  const visit = await prisma.boothVisit.create({
    data: {
      eventId: entry.eventId,
      eventExhibitorId: entry.id,
      bookingId: booking.id,
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      attendeeCompany: booking.attendeeCompany,
      attendeeDesignation: booking.attendeeDesignation,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return { alreadyScanned: false, visit };
}

export async function registerAtBooth(
  token: string,
  data: {
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    attendeeCompany: string;
    attendeeDesignation: string;
    attendeeSector: string;
  }
): Promise<BoothRegisterResult> {
  try {
    const entry = await getKioskExhibitorByToken(token);
    if (!entry) return { error: "This booth link is not active." };

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId: entry.eventId, isActive: true },
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
      eventId: entry.eventId,
      ticketTypeId: visitorTicket.id,
      ...data,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid registration details" };
    }

    const bookingResult = await createBooking({
      eventId: entry.eventId,
      items: [{ ticketTypeId: visitorTicket.id, quantity: 1 }],
      attendeeName: parsed.data.attendeeName,
      attendeeEmail: parsed.data.attendeeEmail,
      attendeePhone: parsed.data.attendeePhone,
      attendeeCompany: parsed.data.attendeeCompany,
      attendeeDesignation: parsed.data.attendeeDesignation,
      attendeeSector: parsed.data.attendeeSector,
    });

    if (bookingResult.error) {
      if (bookingResult.alreadyRegistered && bookingResult.bookingNumber) {
        const booking = await prisma.booking.findFirst({
          where: {
            bookingNumber: bookingResult.bookingNumber,
            eventId: entry.eventId,
            status: "CONFIRMED",
          },
        });
        if (!booking) {
          return { error: "You are already registered. Complete payment or check your email for your pass." };
        }

        const { visit } = await recordBoothVisitForBooking(entry, booking);
        return {
          success: true,
          alreadyRegistered: true,
          bookingNumber: booking.bookingNumber,
          visitor: {
            name: visit.attendeeName,
            email: visit.attendeeEmail,
            company: visit.attendeeCompany,
            designation: visit.attendeeDesignation,
            bookingNumber: booking.bookingNumber,
            scannedAt: visit.scannedAt.toISOString(),
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
        eventId: entry.eventId,
        status: "CONFIRMED",
      },
    });

    if (!booking) {
      return { error: "Registration could not be completed." };
    }

    const { visit } = await recordBoothVisitForBooking(entry, booking);

    return {
      success: true,
      alreadyRegistered: false,
      bookingNumber: booking.bookingNumber,
      visitor: {
        name: visit.attendeeName,
        email: visit.attendeeEmail,
        company: visit.attendeeCompany,
        designation: visit.attendeeDesignation,
        bookingNumber: booking.bookingNumber,
        scannedAt: visit.scannedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "Booth visitor tracking is not available yet. Run prisma db push." };
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

export async function scanBoothVisitor(token: string, qrData: string): Promise<BoothScanResult> {
  const trimmed = qrData.trim();
  if (!trimmed) return { error: "No QR code data provided" };

  try {
    const entry = await getKioskExhibitorByToken(token);
    if (!entry) return { error: "This booth kiosk link is not active." };

    const unlocked = await hasValidBoothKioskSession(token, entry.id);
    if (!unlocked) return { error: "Session expired. Enter the booth password again." };

    const { bookingNumber, eventId: payloadEventId } = parseVisitorQr(trimmed);
    if (!bookingNumber) return { error: "Invalid visitor pass" };
    if (payloadEventId && payloadEventId !== entry.eventId) {
      return { error: "This pass is for a different event" };
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber,
        eventId: entry.eventId,
        status: "CONFIRMED",
      },
    });

    if (!booking) {
      return { error: "Visitor pass not found or not confirmed for this event" };
    }

    const { alreadyScanned, visit } = await recordBoothVisitForBooking(entry, booking);

    return {
      success: true,
      alreadyScanned,
      visitor: {
        name: visit.attendeeName,
        email: visit.attendeeEmail,
        company: visit.attendeeCompany,
        designation: visit.attendeeDesignation,
        bookingNumber: booking.bookingNumber,
        scannedAt: visit.scannedAt.toISOString(),
      },
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "Booth visitor tracking is not available yet. Run prisma db push." };
    }
    throw error;
  }
}

export async function configureBoothKiosk(
  eventExhibitorId: string,
  data: { enabled: boolean; password?: string }
) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  try {
    const entry = await prisma.eventExhibitor.findUnique({
      where: { id: eventExhibitorId },
      select: { id: true, boothKioskToken: true },
    });
    if (!entry) return { error: "Exhibitor not found" };

    const password = data.password?.trim();
    if (data.enabled && !password && !entry.boothKioskToken) {
      // enabling fresh — password required on first setup unless already has hash
    }

    const update: {
      boothKioskEnabled: boolean;
      boothKioskToken?: string;
      boothKioskPasswordHash?: string;
    } = {
      boothKioskEnabled: data.enabled,
    };

    if (!entry.boothKioskToken) {
      update.boothKioskToken = nanoid(24);
    }

    if (password) {
      update.boothKioskPasswordHash = await bcrypt.hash(password, 12);
    } else if (data.enabled) {
      const current = await prisma.eventExhibitor.findUnique({
        where: { id: eventExhibitorId },
        select: { boothKioskPasswordHash: true },
      });
      if (!current?.boothKioskPasswordHash) {
        return { error: "Set a password before enabling the booth kiosk" };
      }
    }

    const updated = await prisma.eventExhibitor.update({
      where: { id: eventExhibitorId },
      data: update,
      select: { boothKioskToken: true, boothKioskEnabled: true },
    });

    revalidatePath("/admin");
    return {
      success: true as const,
      token: updated.boothKioskToken,
      enabled: updated.boothKioskEnabled,
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { error: "Booth visitor tracking is not available yet. Run prisma db push." };
    }
    throw error;
  }
}
