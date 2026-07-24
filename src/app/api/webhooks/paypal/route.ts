import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhook } from "@/lib/paypal";
import { confirmBookingPayment, confirmBoothPayment } from "@/lib/payment-confirm";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    custom_id?: string;
  };
};

export async function POST(request: Request) {
  const body = await request.text();

  try {
    const verified = await verifyPayPalWebhook({
      headers: {
        transmissionId: request.headers.get("paypal-transmission-id"),
        transmissionTime: request.headers.get("paypal-transmission-time"),
        certUrl: request.headers.get("paypal-cert-url"),
        authAlgo: request.headers.get("paypal-auth-algo"),
        transmissionSig: request.headers.get("paypal-transmission-sig"),
      },
      body,
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body) as PayPalWebhookEvent;

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      const captureId = event.resource?.id;

      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      const payment = await prisma.payment.findUnique({
        where: { paypalOrderId: orderId },
      });

      if (!payment || payment.status === "COMPLETED") {
        return NextResponse.json({ received: true });
      }

      if (payment.purpose === "booth" && payment.eventBoothId) {
        await confirmBoothPayment(payment.eventBoothId, {
          gateway: "paypal",
          paypalCaptureId: captureId,
        });
      } else if (payment.bookingId) {
        await confirmBookingPayment(payment.bookingId, {
          gateway: "paypal",
          paypalCaptureId: captureId,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
