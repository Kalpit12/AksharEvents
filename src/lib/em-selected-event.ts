/** Cookie that remembers the Event Master dashboard's selected published event. */
export const EM_SELECTED_EVENT_COOKIE = "em_event_id";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days
const COOKIE_PATH = "/admin";

export function persistEmSelectedEventId(eventId: string) {
  if (typeof document === "undefined" || !eventId) return;
  document.cookie = [
    `${EM_SELECTED_EVENT_COOKIE}=${encodeURIComponent(eventId)}`,
    `Path=${COOKIE_PATH}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}

export function readEmSelectedEventIdFromCookieHeader(
  cookieHeader: string | null | undefined
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq);
    if (name !== EM_SELECTED_EVENT_COOKIE) continue;
    const value = part.slice(eq + 1);
    try {
      return decodeURIComponent(value) || null;
    } catch {
      return value || null;
    }
  }
  return null;
}
