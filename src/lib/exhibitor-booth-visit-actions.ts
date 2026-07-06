"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { isPrismaSchemaDriftError, prisma } from "@/lib/prisma";

export type ExhibitorBoothScanResult =
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

async function assertExhibitorBoothAccess(eventExhibitorId: string, userId: string) {
  const access = await requireExhibitorAccess(userId);
  if (!access) return { error: "Unauthorized" as const };

  const entry = await prisma.eventExhibitor.findFirst({
    where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
    select: { id: true, eventId: true },
  });
  if (!entry) return { error: "Exhibitor booth not found" as const };

  return { entry };
}

export async function scanExhibitorBoothVisitor(
  eventExhibitorId: string,
  qrData: string
): Promise<ExhibitorBoothScanResult> {
  const trimmed = qrData.trim();
  if (!trimmed) return { error: "No QR code data provided" };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to scan visitor passes" };

  try {
    const accessCheck = await assertExhibitorBoothAccess(eventExhibitorId, user.id);
    if ("error" in accessCheck) return { error: accessCheck.error };

    const { eventId } = accessCheck.entry;
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
    });

    if (!booking) {
      return { error: "Visitor pass not found or not confirmed for this event" };
    }

    const existing = await prisma.boothVisit.findUnique({
      where: {
        eventExhibitorId_bookingId: {
          eventExhibitorId,
          bookingId: booking.id,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        alreadyScanned: true,
        visitor: {
          name: existing.attendeeName,
          email: existing.attendeeEmail,
          company: existing.attendeeCompany,
          designation: existing.attendeeDesignation,
          bookingNumber: booking.bookingNumber,
          scannedAt: existing.scannedAt.toISOString(),
        },
      };
    }

    const visit = await prisma.boothVisit.create({
      data: {
        eventId,
        eventExhibitorId,
        bookingId: booking.id,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        attendeeCompany: booking.attendeeCompany,
        attendeeDesignation: booking.attendeeDesignation,
      },
    });

    revalidatePath("/exhibitor");

    return {
      success: true,
      alreadyScanned: false,
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
      return { error: "Booth visitor check-in is not available yet. Run prisma db push." };
    }
    throw error;
  }
}
