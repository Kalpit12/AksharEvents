import { prisma } from "@/lib/prisma";
import { requireMobileUser, jsonError, jsonOk } from "@/lib/mobile-api";
import { getTicketQRPayload } from "@/lib/qr";

export async function POST(request: Request) {
  const user = await requireMobileUser(request, "ADMIN", "ORGANIZER");
  if (!user) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const bookingNumber = body.bookingNumber as string;
  const eventId = body.eventId as string | undefined;

  if (!bookingNumber) return jsonError("bookingNumber is required");

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber },
    include: { event: true, items: true },
  });

  if (!booking) return jsonError("Ticket not found", 404);
  if (eventId && booking.eventId !== eventId) {
    return jsonError("Ticket is for a different event", 400);
  }
  if (booking.status !== "CONFIRMED") {
    return jsonError(`Booking status: ${booking.status}`, 400);
  }

  const existing = await prisma.attendance.findFirst({
    where: { bookingId: booking.id },
  });

  if (existing) {
    return jsonOk({
      alreadyCheckedIn: true,
      attendeeName: booking.attendeeName,
      eventTitle: booking.event.title,
      checkedInAt: existing.checkedInAt.toISOString(),
    });
  }

  const attendance = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
    return tx.attendance.create({
      data: {
        bookingId: booking.id,
        checkedInBy: user.id,
        deviceInfo: "QR_SCAN",
      },
    });
  });

  return jsonOk({
    success: true,
    attendeeName: booking.attendeeName,
    eventTitle: booking.event.title,
    bookingNumber: booking.bookingNumber,
    checkedInAt: attendance.checkedInAt.toISOString(),
    qrPayload: getTicketQRPayload(booking.bookingNumber, booking.eventId),
  });
}
