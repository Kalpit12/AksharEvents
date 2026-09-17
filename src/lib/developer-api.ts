import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const DEVELOPER_SCOPES = [
  "events:read",
  "bookings:read",
  "stats:read",
  "checkin:write",
] as const;

export type DeveloperScope = (typeof DEVELOPER_SCOPES)[number];

export type AuthenticatedApiKey = {
  id: string;
  name: string;
  eventId: string | null;
  scopes: string[];
  rateLimit: number;
};

function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKeySecret() {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `axr_live_${secret}`;
  const keyPrefix = rawKey.slice(0, 16);
  return { rawKey, keyPrefix, keyHash: hashApiKey(rawKey) };
}

export function getApiKeyFromRequest(request: Request): string | null {
  const header =
    request.headers.get("API-Key") ||
    request.headers.get("api-key") ||
    request.headers.get("x-api-key");
  if (header?.trim()) return header.trim();

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export function isAdminGatewayKey(rawKey: string | null) {
  const adminKey = process.env.AXAR_API_ADMIN_KEY?.trim();
  return Boolean(adminKey && rawKey && rawKey === adminKey);
}

export async function authenticateApiKey(
  request: Request,
): Promise<
  | { ok: true; key: AuthenticatedApiKey }
  | { ok: false; response: NextResponse }
> {
  const rawKey = getApiKeyFromRequest(request);
  if (!rawKey) {
    return {
      ok: false,
      response: jsonApiError("Missing API-Key header", 401),
    };
  }

  if (isAdminGatewayKey(rawKey)) {
    return {
      ok: true,
      key: {
        id: "admin",
        name: "Gateway Admin",
        eventId: null,
        scopes: [...DEVELOPER_SCOPES],
        rateLimit: 300,
      },
    };
  }

  const keyHash = hashApiKey(rawKey);
  const record = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!record || !record.isActive) {
    return { ok: false, response: jsonApiError("Invalid API key", 401) };
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { ok: false, response: jsonApiError("API key expired", 401) };
  }

  const ip = getClientIp(request);
  const limited = rateLimit(
    `api-key:${record.id}:${ip}`,
    record.rateLimit,
    60_000,
  );
  if (!limited.success) {
    return {
      ok: false,
      response: jsonApiError("Rate limit exceeded", 429),
    };
  }

  // Fire-and-forget usage counters (do not block the response)
  void prisma.apiKey
    .update({
      where: { id: record.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 },
      },
    })
    .catch(() => undefined);

  return {
    ok: true,
    key: {
      id: record.id,
      name: record.name,
      eventId: record.eventId,
      scopes: record.scopes,
      rateLimit: record.rateLimit,
    },
  };
}

export function requireScope(
  key: AuthenticatedApiKey,
  scope: DeveloperScope,
): NextResponse | null {
  if (!key.scopes.includes(scope) && !key.scopes.includes("*")) {
    return jsonApiError(`Missing required scope: ${scope}`, 403);
  }
  return null;
}

export function assertEventAccess(
  key: AuthenticatedApiKey,
  eventId: string,
): NextResponse | null {
  if (key.eventId && key.eventId !== eventId) {
    return jsonApiError("API key is not authorized for this event", 403);
  }
  return null;
}

export function jsonApiError(message: string, status = 400) {
  return NextResponse.json(
    { error: message, status: "error" },
    { status },
  );
}

export function jsonApiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function logApiUsage(params: {
  apiKeyId: string;
  path: string;
  method: string;
  status: number;
}) {
  if (params.apiKeyId === "admin") return;
  try {
    await prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId: params.apiKeyId,
        path: params.path,
        method: params.method,
        status: params.status,
      },
    });
  } catch {
    // ignore logging failures
  }
}

export async function createDeveloperApiKey(input: {
  name: string;
  eventId?: string | null;
  rateLimit?: number;
  scopes?: string[];
  createdById?: string | null;
  expiresAt?: Date | null;
}) {
  if (input.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: { id: true },
    });
    if (!event) {
      throw new Error("Event not found");
    }
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKeySecret();
  const scopes =
    input.scopes && input.scopes.length > 0
      ? input.scopes
      : [...DEVELOPER_SCOPES];

  const record = await prisma.apiKey.create({
    data: {
      name: input.name,
      keyPrefix,
      keyHash,
      eventId: input.eventId ?? null,
      rateLimit: input.rateLimit ?? 60,
      scopes,
      createdById: input.createdById ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });

  return {
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    /** Returned only once — store securely */
    apiKey: rawKey,
    eventId: record.eventId,
    rateLimit: record.rateLimit,
    scopes: record.scopes,
    createdAt: record.createdAt.toISOString(),
  };
}
