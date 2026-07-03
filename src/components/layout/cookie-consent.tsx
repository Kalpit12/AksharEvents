"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  getClientCookieConsent,
  migrateLegacyCookieConsent,
  setClientCookieConsent,
} from "@/lib/cookie-consent";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/launch") return;

    const alreadyAccepted = getClientCookieConsent() || migrateLegacyCookieConsent();
    if (!alreadyAccepted) {
      setVisible(true);
    }
  }, [pathname]);

  const acceptCookies = () => {
    setClientCookieConsent();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="flex gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p id="cookie-consent-title" className="text-sm font-semibold text-foreground">
              We use cookies
            </p>
            <p id="cookie-consent-description" className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We use cookies to improve your experience, keep you signed in, and understand how our website is used.
              By clicking &quot;I Accept&quot;, you agree to our use of cookies. Read our{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <Button onClick={acceptCookies} size="sm" className="w-full shrink-0 sm:w-auto">
          I Accept
        </Button>
      </div>
    </div>
  );
}
