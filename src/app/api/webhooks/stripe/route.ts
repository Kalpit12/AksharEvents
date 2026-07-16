import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";
import { confirmBookingPayment } from "@/lib/payment-confirm";

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

      await confirmBookingPayment(bookingId, {
        gateway: "stripe",
        stripePaymentId: session.payment_intent as string,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
