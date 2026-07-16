import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmBookingPayment, bookingSuccessPath } from "@/lib/payment-confirm";

function extractOrderId(request: Request, body: Record<string, unknown>) {
  const url = new URL(request.url);
  return (
    (body.order_id as string | undefined) ??
    (body.orderId as string | undefined) ??
    url.searchParams.get("order_id") ??
    url.searchParams.get("orderId") ??
    null
  );
}

function extractStatus(body: Record<string, unknown>, url: URL) {
  return (
    (body.status as string | undefined) ??
    (body.status_id as string | undefined) ??
    url.searchParams.get("status") ??
    url.searchParams.get("status_id") ??
    ""
  );
}

function isSuccessStatus(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized === "charged" ||
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "21"
  );
}

export async function GET(request: Request) {
  return handleReturn(request, {});
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
  }
  return handleReturn(request, body);
}

async function handleReturn(request: Request, body: Record<string, unknown>) {
  const url = new URL(request.url);
  const orderId = extractOrderId(request, body);

  if (!orderId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payment = await prisma.payment.findUnique({
    where: { hdfcOrderId: orderId },
    include: { booking: { include: { event: { select: { slug: true } } } } },
  });

  if (!payment) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const status = extractStatus(body, url);
  const partnerSlug =
    payment.booking.partnerSlug ??
    (typeof payment.metadata === "object" &&
    payment.metadata !== null &&
    "partnerSlug" in payment.metadata
      ? String((payment.metadata as { partnerSlug?: string }).partnerSlug ?? "")
      : null);

  if (isSuccessStatus(status) || payment.status === "COMPLETED") {
    if (payment.status !== "COMPLETED") {
      await confirmBookingPayment(payment.bookingId, {
        gateway: "hdfc",
        hdfcPaymentId: (body.payment_id as string | undefined) ?? orderId,
      });
    }

    return NextResponse.redirect(
      new URL(
        bookingSuccessPath(payment.booking.bookingNumber, partnerSlug),
        request.url
      )
    );
  }

  const cancelTarget = partnerSlug
    ? `/p/${partnerSlug}/events/${payment.booking.event.slug}`
    : `/events/${payment.booking.event.slug}`;

  return NextResponse.redirect(new URL(cancelTarget, request.url));
}
