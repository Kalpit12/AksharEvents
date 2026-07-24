type PayPalAccessToken = {
  access_token: string;
  expires_in: number;
};

type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrder = {
  id: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id: string; status?: string }>;
    };
  }>;
};

type PayPalWebhookVerification = {
  verification_status: "SUCCESS" | "FAILURE";
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function isPayPalEnabled() {
  return (
    process.env.PAYPAL_ENABLED === "true" &&
    !!process.env.PAYPAL_CLIENT_ID &&
    !!process.env.PAYPAL_CLIENT_SECRET
  );
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as PayPalAccessToken;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function paypalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal API error: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

function formatAmount(amount: number) {
  return amount.toFixed(2);
}

export async function createPayPalOrder({
  amount,
  currency,
  returnUrl,
  cancelUrl,
  customId,
  description,
}: {
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  customId: string;
  description: string;
}) {
  if (!isPayPalEnabled()) throw new Error("PayPal is not enabled");

  const order = await paypalFetch<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: customId,
          description: description.slice(0, 127),
          amount: {
            currency_code: currency.toUpperCase(),
            value: formatAmount(amount),
          },
        },
      ],
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_APP_NAME ?? "AxarEvents",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const approvalLink = order.links?.find((link) => link.rel === "approve")?.href;
  if (!order.id || !approvalLink) {
    throw new Error("PayPal order missing approval link");
  }

  return { orderId: order.id, approvalUrl: approvalLink, status: order.status };
}

export async function capturePayPalOrder(orderId: string) {
  if (!isPayPalEnabled()) throw new Error("PayPal is not enabled");

  const order = await paypalFetch<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: "{}",
  });

  const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return {
    orderId: order.id,
    captureId: captureId ?? null,
    status: order.status ?? "UNKNOWN",
  };
}

export async function getPayPalOrder(orderId: string) {
  return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${orderId}`);
}

export async function verifyPayPalWebhook({
  headers,
  body,
}: {
  headers: {
    transmissionId: string | null;
    transmissionTime: string | null;
    certUrl: string | null;
    authAlgo: string | null;
    transmissionSig: string | null;
  };
  body: string;
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PayPal webhook not configured");
  }

  if (
    !headers.transmissionId ||
    !headers.transmissionTime ||
    !headers.certUrl ||
    !headers.authAlgo ||
    !headers.transmissionSig
  ) {
    throw new Error("Missing PayPal webhook headers");
  }

  const result = await paypalFetch<PayPalWebhookVerification>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  return result.verification_status === "SUCCESS";
}
