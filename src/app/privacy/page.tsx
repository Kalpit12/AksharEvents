import { AboutBackground } from "@/components/about/about-background";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.name} collects, uses, and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <Shield className="h-3.5 w-3.5" />
            Legal
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: July 2026</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm dark:border-champagne/15 sm:p-8 lg:p-10">
          <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              {BRAND.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, store, and safeguard personal information when you use our
              website, book event tickets, or register as an exhibitor on our platform.
            </p>

            <h2 className="text-xl font-bold text-foreground">Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-foreground">Account information:</strong> name, email address, phone number, and
                password when you create an account.
              </li>
              <li>
                <strong className="text-foreground">Exhibitor information:</strong> company name, products or services,
                company description, website, booth preferences, team member details, travel documents, and branding
                artwork submitted through the Exhibitor Portal.
              </li>
              <li>
                <strong className="text-foreground">Booking information:</strong> ticket selections, payment details
                processed securely via Stripe, and attendance records.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> pages visited, device type, browser, IP
                address, and cookies used to improve platform performance and security.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">How We Use Your Information</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Process event bookings, payments, and confirmations</li>
              <li>Manage exhibitor registrations, booth assignments, and event logistics</li>
              <li>Send event updates, schedule changes, and service-related notifications</li>
              <li>Verify identity, prevent fraud, and maintain platform security</li>
              <li>Improve our services, analytics, and user experience</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share data with trusted service providers who help us
              operate the platform (such as payment processors, email delivery, and cloud storage), event organisers
              where necessary to fulfil your registration or booking, and authorities when required by law.
            </p>

            <h2 className="text-xl font-bold text-foreground">Data Retention</h2>
            <p>
              We retain personal information for as long as needed to provide our services, comply with legal
              obligations, resolve disputes, and enforce our agreements. Exhibitor and event-related records may be
              retained for operational and audit purposes after an event concludes.
            </p>

            <h2 className="text-xl font-bold text-foreground">Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your information, including
              encrypted connections, secure payment processing, access controls, and protected file storage for
              sensitive exhibitor documents.
            </p>

            <h2 className="text-xl font-bold text-foreground">Your Rights</h2>
            <p>
              Depending on applicable law, you may have the right to access, correct, update, or delete your personal
              information, or to object to certain processing. To exercise these rights, contact us using the details
              below.
            </p>

            <h2 className="text-xl font-bold text-foreground">Cookies</h2>
            <p>
              We use cookies and similar technologies to keep you signed in, remember preferences, and understand how
              our platform is used. When you accept cookies on our site, we store a first-party consent cookie named{" "}
              <strong className="text-foreground">axar-cookie-consent</strong> on your device for up to 12 months so
              we do not show the consent banner again. You can control or delete cookies through your browser settings,
              though some features may not function correctly if cookies are disabled.
            </p>

            <h2 className="text-xl font-bold text-foreground">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be posted on this page with an
              updated effective date. Continued use of the platform after changes constitutes acceptance of the
              revised policy.
            </p>

            <h2 className="text-xl font-bold text-foreground">Contact Us</h2>
            <p>
              For privacy-related questions or requests, contact us at{" "}
              <a href="mailto:info@axarevents.com" className="text-primary hover:underline">
                info@axarevents.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
