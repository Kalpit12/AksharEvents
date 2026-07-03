export const COOKIE_CONSENT_NAME = "axar-cookie-consent";
export const COOKIE_CONSENT_VALUE = "accepted";
/** 12 months */
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const LEGACY_LOCAL_STORAGE_KEY = COOKIE_CONSENT_NAME;

export function hasCookieConsentFromDocument(cookieHeader: string): boolean {
  if (!cookieHeader) return false;

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => {
      const [name, value] = part.split("=");
      return name === COOKIE_CONSENT_NAME && value === COOKIE_CONSENT_VALUE;
    });
}

export function getClientCookieConsent(): boolean {
  if (typeof document === "undefined") return false;
  return hasCookieConsentFromDocument(document.cookie);
}

export function setClientCookieConsent(): void {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${COOKIE_CONSENT_NAME}=${COOKIE_CONSENT_VALUE}`,
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    secure,
  ]
    .filter(Boolean)
    .join("; ");

  try {
    localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    // Ignore private browsing / storage restrictions.
  }
}

/** Migrate visitors who accepted via the earlier localStorage implementation. */
export function migrateLegacyCookieConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY) === COOKIE_CONSENT_VALUE) {
      setClientCookieConsent();
      return true;
    }
  } catch {
    // Ignore storage restrictions.
  }

  return false;
}
