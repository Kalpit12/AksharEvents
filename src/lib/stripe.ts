import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function isStripeEnabled() {
  return !!stripe && !!process.env.STRIPE_PUBLISHABLE_KEY;
}

export async function createCheckoutSession({
  bookingId,
  bookingNumber,
  items,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata,
}: {
  bookingId: string;
  bookingNumber: string;
  items: { name: string; quantity: number; unitAmount: number }[];
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) throw new Error("Stripe is not configured");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: items.map((item) => ({
      price_data: {
        currency: "kes",
        product_data: { name: item.name },
        unit_amount: Math.round(item.unitAmount * 100),
      },
      quantity: item.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      bookingId,
      bookingNumber,
      ...metadata,
    },
  });

  return session;
}

export async function constructWebhookEvent(body: string, signature: string) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook not configured");
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
