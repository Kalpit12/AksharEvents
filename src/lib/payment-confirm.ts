import { prisma } from "@/lib/prisma";
import { sendTicketConfirmation } from "@/lib/email";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { partnerPath } from "@/lib/partners";

export async function confirmBookingPayment(bookingId: string, paymentUpdate: {
  gateway: "stripe" | "hdfc";
  stripePaymentId?: string;
  hdfcPaymentId?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: { include: { venue: { select: { name: true, city: true } } } },
      items: { include: { ticketType: true } },
      payment: true,
    },
  });

  if (!booking || booking.status === "CONFIRMED") {
    return booking;
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    }),
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: "COMPLETED",
        gateway: paymentUpdate.gateway,
        ...(paymentUpdate.stripePaymentId
          ? { stripePaymentId: paymentUpdate.stripePaymentId }
          : {}),
        ...(paymentUpdate.hdfcPaymentId
          ? { hdfcPaymentId: paymentUpdate.hdfcPaymentId }
          : {}),
      },
    }),
  ]);

  if (booking.userId) {
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_CONFIRMED",
        title: "Payment Confirmed",
        message: `Your tickets for ${booking.event.title} are confirmed.`,
        link: `/pass/${booking.bookingNumber}`,
      },
    });
  }

  const qrDataUrl = await generateQRCodeDataUrl(
    getTicketQRPayload(booking.bookingNumber, booking.eventId)
  );

  const primaryTicket = booking.items[0]?.ticketType;
  await sendTicketConfirmation({
    to: booking.attendeeEmail,
    name: booking.attendeeName,
    designation: booking.attendeeDesignation,
    company: booking.attendeeCompany,
    eventTitle: booking.event.title,
    eventSlug: booking.event.slug,
    startDate: booking.event.startDate,
    endDate: booking.event.endDate,
    startTime: booking.event.startTime,
    endTime: booking.event.endTime,
    venueName: booking.event.venue?.name,
    venueCity: booking.event.venue?.city,
    bookingNumber: booking.bookingNumber,
    qrCodeUrl: qrDataUrl,
    totalAmount: booking.totalAmount.toString(),
    currency: booking.currency,
    passLabel: getPassBadgeLabel(primaryTicket?.name, primaryTicket?.tier),
  });

  return booking;
}

export function bookingSuccessPath(bookingNumber: string, partnerSlug?: string | null) {
  if (partnerSlug) {
    return `${partnerPath(partnerSlug, "/booking/success")}?booking=${bookingNumber}`;
  }
  return `/booking/success?booking=${bookingNumber}`;
}
