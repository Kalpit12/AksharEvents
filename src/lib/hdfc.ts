import { nanoid } from "nanoid";

type HdfcSessionResponse = {
  payment_link?: string;
  paymentLink?: string;
  sdk_payload?: unknown;
  order_id?: string;
};

let juspayClient: {
  orderSession: {
    create: (params: Record<string, unknown>) => Promise<HdfcSessionResponse>;
  };
} | null = null;

function getBaseUrl() {
  return process.env.HDFC_ENV === "production"
    ? "https://smartgateway.hdfc.bank.in"
    : "https://smartgateway.hdfcuat.bank.in";
}

async function getJuspayClient() {
  if (juspayClient) return juspayClient;

  const merchantId = process.env.HDFC_MERCHANT_ID;
  const keyId = process.env.HDFC_KEY_UUID;
  const publicKey = process.env.HDFC_PUBLIC_KEY;
  const privateKey = process.env.HDFC_PRIVATE_KEY;

  if (!merchantId || !keyId || !publicKey || !privateKey) {
    return null;
  }

  const { Juspay } = await import("expresscheckout-nodejs");
  juspayClient = new Juspay({
    merchantId,
    baseUrl: getBaseUrl(),
    jweAuth: {
      keyId,
      publicKey: publicKey.replace(/\\n/g, "\n"),
      privateKey: privateKey.replace(/\\n/g, "\n"),
    },
  }) as unknown as typeof juspayClient;

  return juspayClient;
}

export function isHdfcEnabled() {
  return !!(
    process.env.HDFC_MERCHANT_ID &&
    process.env.HDFC_PAYMENT_PAGE_CLIENT_ID &&
    process.env.HDFC_KEY_UUID &&
    process.env.HDFC_PUBLIC_KEY &&
    process.env.HDFC_PRIVATE_KEY
  );
}

/** HDFC order_id must be unique and under 21 characters */
export function generateHdfcOrderId() {
  return `AE${nanoid(12)}`;
}

export async function createHdfcPaymentSession({
  orderId,
  amount,
  customerId,
  returnUrl,
  currency = "INR",
}: {
  orderId: string;
  amount: number;
  customerId: string;
  returnUrl: string;
  currency?: string;
}) {
  const client = await getJuspayClient();
  if (!client) throw new Error("HDFC SmartGateway is not configured");

  const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID!;

  const session = await client.orderSession.create({
    order_id: orderId,
    amount: amount.toFixed(2),
    payment_page_client_id: paymentPageClientId,
    customer_id: customerId.slice(0, 50),
    action: "paymentPage",
    return_url: returnUrl,
    currency,
  });

  const paymentLink = session.payment_link ?? session.paymentLink;
  if (!paymentLink) {
    throw new Error("HDFC session did not return a payment link");
  }

  return { paymentLink, orderId };
}
