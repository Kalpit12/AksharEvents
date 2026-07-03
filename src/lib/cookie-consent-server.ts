import { cookies } from "next/headers";
import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VALUE,
  hasCookieConsentFromDocument,
} from "@/lib/cookie-consent";

export async function hasServerCookieConsent(): Promise<boolean> {
  const cookieStore = await cookies();
  const consent = cookieStore.get(COOKIE_CONSENT_NAME);
  return consent?.value === COOKIE_CONSENT_VALUE;
}

export { hasCookieConsentFromDocument };
