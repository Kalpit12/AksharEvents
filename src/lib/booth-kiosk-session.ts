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

function cookieName(eventSlug: string) {
  return `${COOKIE_PREFIX}${eventSlug}`;
}

function cookiePath(eventSlug: string) {
  return `/booth/${eventSlug}`;
}

type SessionPayload = {
  eventId: string;
  expiresAt: number;
};

function encodeSessionValue({ eventId, expiresAt }: SessionPayload) {
  const payload = `${eventId}:${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}:${signature}`;
}

function parseSessionValue(value: string, expectedEventId: string): SessionPayload | null {
  const parts = value.split(":");
  if (parts.length < 3) return null;

  const signature = parts.pop();
  const expiresAtRaw = parts.pop();
  const eventId = parts.join(":");

  if (!signature || !expiresAtRaw || eventId !== expectedEventId) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const payload = `${eventId}:${expiresAtRaw}`;
  const expected = signPayload(payload);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { eventId, expiresAt };
}

async function readSession(eventSlug: string, eventId: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName(eventSlug))?.value;
  if (!value) return null;
  return parseSessionValue(value, eventId);
}

export async function getBoothKioskSession(eventSlug: string, eventId: string) {
  const session = await readSession(eventSlug, eventId);
  if (!session) {
    return { unlocked: false as const };
  }
  return { unlocked: true as const };
}

export async function setBoothKioskUnlocked(eventSlug: string, eventId: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  cookieStore.set(cookieName(eventSlug), encodeSessionValue({ eventId, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: cookiePath(eventSlug),
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearBoothKioskSession(eventSlug: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName(eventSlug));
}

export async function requireBoothKioskUnlocked(eventSlug: string, eventId: string) {
  const session = await getBoothKioskSession(eventSlug, eventId);
  if (!session.unlocked) {
    return { ok: false as const, error: "Enter the on-site password to continue." };
  }
  return { ok: true as const };
}
