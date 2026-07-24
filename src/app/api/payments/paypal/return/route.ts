import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import {
  bookingSuccessPath,
  confirmBookingPayment,
  confirmBoothPayment,
} from "@/lib/payment-confirm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const orderId = token ?? url.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payment = await prisma.payment.findUnique({
    where: { paypalOrderId: orderId },
    include: {
      booking: { include: { event: { select: { slug: true } } } },
      eventBooth: {
        select: {
          id: true,
          code: true,
          eventId: true,
          event: { select: { slug: true } },
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    if (payment.status !== "COMPLETED") {
      const capture = await capturePayPalOrder(orderId);

      if (payment.purpose === "booth" && payment.eventBoothId) {
        await confirmBoothPayment(payment.eventBoothId, {
          gateway: "paypal",
          paypalCaptureId: capture.captureId ?? undefined,
        });
      } else if (payment.bookingId) {
        await confirmBookingPayment(payment.bookingId, {
          gateway: "paypal",
          paypalCaptureId: capture.captureId ?? undefined,
        });
      }
    }

    if (payment.purpose === "booth") {
      return NextResponse.redirect(
        new URL("/exhibitor?tab=booth-floor&paid=1", request.url)
      );
    }

    if (payment.booking) {
      return NextResponse.redirect(
        new URL(
          bookingSuccessPath(payment.booking.bookingNumber, payment.booking.partnerSlug),
          request.url
        )
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("PayPal return error:", err);

    if (payment.purpose === "booth") {
      return NextResponse.redirect(
        new URL("/exhibitor?tab=booth-floor&paid=0", request.url)
      );
    }

    const cancelSlug = payment.booking?.event.slug;
    return NextResponse.redirect(
      new URL(cancelSlug ? `/events/${cancelSlug}` : "/", request.url)
    );
  }
}
