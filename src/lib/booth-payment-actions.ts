"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { createPayPalOrder, isPayPalEnabled } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function getPaypalBoothCheckoutAvailability(eventExhibitorId: string) {
  if (!isPayPalEnabled()) {
    return { available: false as const, amount: null, currency: null, eventBoothId: null };
  }

  const eventExhibitor = await prisma.eventExhibitor.findUnique({
    where: { id: eventExhibitorId },
    select: {
      id: true,
      event: {
        select: {
          partnerId: true,
          boothFee: true,
          boothFeeCurrency: true,
          slug: true,
        },
      },
      eventBooth: {
        select: {
          id: true,
          code: true,
          status: true,
          paymentVerified: true,
        },
      },
    },
  });

  if (!eventExhibitor?.eventBooth) {
    return { available: false as const, amount: null, currency: null, eventBoothId: null };
  }

  const fee = eventExhibitor.event.boothFee?.toNumber() ?? 0;
  const booth = eventExhibitor.eventBooth;
  const available =
    !eventExhibitor.event.partnerId &&
    fee > 0 &&
    !booth.paymentVerified &&
    (booth.status === "RESERVED" || booth.status === "OCCUPIED");

  return {
    available,
    amount: available ? fee : null,
    currency: available ? eventExhibitor.event.boothFeeCurrency : null,
    eventBoothId: available ? booth.id : null,
    boothCode: booth.code,
  };
}

export async function startBoothPayPalCheckout(eventBoothId: string) {
  if (!isPayPalEnabled()) {
    return { error: "PayPal checkout is not available." as const };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required" as const };

  const access = await requireExhibitorAccess(user.id);
  if (!access) return { error: "Exhibitor access required" as const };

  const booth = await prisma.eventBooth.findUnique({
    where: { id: eventBoothId },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          title: true,
          partnerId: true,
          boothFee: true,
          boothFeeCurrency: true,
        },
      },
      eventExhibitor: {
        select: { id: true, exhibitorId: true },
      },
      payment: true,
    },
  });

  if (!booth?.eventExhibitor) {
    return { error: "Booth reservation not found." as const };
  }

  if (booth.eventExhibitor.exhibitorId !== access.exhibitor.id) {
    return { error: "You do not own this booth reservation." as const };
  }

  if (booth.event.partnerId) {
    return { error: "PayPal booth checkout is only available on the main site." as const };
  }

  if (booth.paymentVerified) {
    return { error: "Payment already verified for this booth." as const };
  }

  const amount = booth.event.boothFee?.toNumber() ?? 0;
  if (amount <= 0) {
    return { error: "No booth fee is configured for this event." as const };
  }

  if (booth.status !== "RESERVED" && booth.status !== "OCCUPIED") {
    return { error: "Reserve a booth before paying." as const };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5001";
  const returnUrl = `${appUrl}/api/payments/paypal/return`;
  const cancelUrl = `${appUrl}/exhibitor?tab=booth-floor`;
  const currency = booth.event.boothFeeCurrency || "KES";
  const invoiceNumber = `BOOTH-${booth.code}-${booth.id.slice(-6).toUpperCase()}`;

  try {
    const order = await createPayPalOrder({
      amount,
      currency,
      returnUrl,
      cancelUrl,
      customId: booth.id,
      description: `${booth.event.title} — booth ${booth.code}`,
    });

    if (booth.payment) {
      await prisma.payment.update({
        where: { id: booth.payment.id },
        data: {
          amount,
          currency,
          status: "PENDING",
          purpose: "booth",
          gateway: "paypal",
          paypalOrderId: order.orderId,
          paypalCaptureId: null,
          invoiceNumber,
          metadata: { eventId: booth.event.id, boothCode: booth.code },
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          eventBoothId: booth.id,
          purpose: "booth",
          amount,
          currency,
          status: "PENDING",
          gateway: "paypal",
          paypalOrderId: order.orderId,
          invoiceNumber,
          metadata: { eventId: booth.event.id, boothCode: booth.code },
        },
      });
    }

    revalidatePath("/exhibitor");
    return { success: true as const, checkoutUrl: order.approvalUrl };
  } catch (err) {
    console.error("Booth PayPal checkout error:", err);
    return { error: "Unable to start PayPal checkout. Please try again." as const };
  }
}
