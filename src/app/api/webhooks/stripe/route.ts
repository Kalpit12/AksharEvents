import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import { sendTicketConfirmation } from "@/lib/email";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const event = await constructWebhookEvent(body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) return NextResponse.json({ received: true });

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          event: { include: { venue: { select: { name: true, city: true } } } },
          items: { include: { ticketType: true } },
        },
      });

      if (!booking) return NextResponse.json({ received: true });

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        }),
        prisma.payment.update({
          where: { bookingId },
          data: {
            status: "COMPLETED",
            stripePaymentId: session.payment_intent as string,
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
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
