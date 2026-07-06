import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "booth_kiosk_";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSigningSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.BOOTH_KIOSK_SECRET ??
    "dev-booth-kiosk-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

function cookieName(token: string) {
  return `${COOKIE_PREFIX}${token}`;
}

export function createBoothKioskSessionValue(eventExhibitorId: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${eventExhibitorId}:${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}:${signature}`;
}

function parseSessionValue(value: string, eventExhibitorId: string) {
  const parts = value.split(":");
  if (parts.length < 3) return false;

  const signature = parts.pop();
  const expiresAtRaw = parts.pop();
  const sessionExhibitorId = parts.join(":");

  if (!signature || !expiresAtRaw || sessionExhibitorId !== eventExhibitorId) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const payload = `${sessionExhibitorId}:${expiresAtRaw}`;
  const expected = signPayload(payload);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setBoothKioskSession(token: string, eventExhibitorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName(token), createBoothKioskSessionValue(eventExhibitorId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/booth/${token}`,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearBoothKioskSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName(token));
}

export async function hasValidBoothKioskSession(token: string, eventExhibitorId: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName(token))?.value;
  if (!value) return false;
  return parseSessionValue(value, eventExhibitorId);
}
