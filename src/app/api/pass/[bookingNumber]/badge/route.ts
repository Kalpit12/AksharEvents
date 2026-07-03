import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { buildVisitorBadgePdf } from "@/lib/visitor-badge-asset";

interface RouteProps {
  params: Promise<{ bookingNumber: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { bookingNumber } = await params;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber },
    include: {
      event: {
        select: {
          title: true,
          startDate: true,
          endDate: true,
          venue: { select: { name: true, city: true } },
        },
      },
      items: { include: { ticketType: true } },
    },
  });

  if (!booking || booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }

  const qrDataUrl = await generateQRCodeDataUrl(
    getTicketQRPayload(booking.bookingNumber, booking.eventId)
  );
  const primaryTicket = booking.items[0]?.ticketType;

  const pdfBytes = await buildVisitorBadgePdf({
    attendeeName: booking.attendeeName,
    attendeeDesignation: booking.attendeeDesignation,
    eventTitle: booking.event.title,
    startDate: booking.event.startDate,
    endDate: booking.event.endDate,
    venueName: booking.event.venue?.name,
    venueCity: booking.event.venue?.city,
    bookingNumber: booking.bookingNumber,
    passLabel: getPassBadgeLabel(primaryTicket?.name, primaryTicket?.tier),
    qrDataUrl,
  });

  const filename = `aksharevents-badge-${booking.bookingNumber}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
