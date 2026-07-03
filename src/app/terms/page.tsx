import { AboutBackground } from "@/components/about/about-background";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `Terms and conditions for using the ${BRAND.name} platform.`,
};

export default function TermsPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <FileText className="h-3.5 w-3.5" />
            Legal
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">Terms and Conditions</h1>
          <p className="mt-3 text-muted-foreground">Last updated: July 2026</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm dark:border-champagne/15 sm:p-8 lg:p-10">
          <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the {BRAND.name} platform,
              including event discovery, ticket booking, exhibitor registration, and related services. By creating an
              account or using our services, you agree to these Terms.
            </p>

            <h2 className="text-xl font-bold text-foreground">Eligibility</h2>
            <p>
              You must be at least 18 years old and able to enter into a binding agreement to use our platform. If you
              register on behalf of a company or organisation, you represent that you have authority to bind that
              entity to these Terms.
            </p>

            <h2 className="text-xl font-bold text-foreground">Platform Use</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>You agree to provide accurate, current, and complete information.</li>
              <li>You must not misuse the platform, attempt unauthorised access, or interfere with its operation.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must comply with all applicable laws and event organiser requirements.</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Ticket Bookings</h2>
            <p>
              Ticket purchases are subject to the policies of the respective event organiser, including refund,
              transfer, and admission rules. {BRAND.name} facilitates bookings and payments but is not the organiser of
              third-party events unless stated otherwise. We are not responsible for event cancellations, changes, or
              disputes between attendees and organisers beyond our role as platform provider.
            </p>

            <h2 className="text-xl font-bold text-foreground">Exhibitor Registration</h2>
            <p>When you register as an exhibitor, you agree that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>All company, team, and logistics information you submit is accurate and kept up to date.</li>
              <li>Uploaded documents and branding artwork are lawful and you have the right to use them.</li>
              <li>You will comply with event rules, booth requirements, deadlines, and organiser instructions.</li>
              <li>Fees, add-ons, and services selected through the portal are subject to organiser and platform policies.</li>
              <li>Organisers may review, approve, or reject submissions including artwork, travel requests, and registrations.</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Payments</h2>
            <p>
              Paid tickets and exhibitor services are processed through secure third-party payment providers. You agree
              to pay all applicable fees and taxes. Failed or disputed payments may result in cancelled bookings or
              suspended access.
            </p>

            <h2 className="text-xl font-bold text-foreground">Intellectual Property</h2>
            <p>
              The platform, branding, software, and content provided by {BRAND.name} remain our property or that of our
              licensors. You retain ownership of content you submit but grant us a licence to use it as needed to
              operate the platform and deliver event services.
            </p>

            <h2 className="text-xl font-bold text-foreground">Disclaimer of Warranties</h2>
            <p>
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee
              uninterrupted access, error-free operation, or that every event listing will meet your expectations.
            </p>

            <h2 className="text-xl font-bold text-foreground">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, {BRAND.name} shall not be liable for indirect, incidental,
              special, consequential, or punitive damages arising from your use of the platform, attendance at events, or
              exhibitor participation.
            </p>

            <h2 className="text-xl font-bold text-foreground">Termination</h2>
            <p>
              We may suspend or terminate access to the platform if you breach these Terms, engage in fraudulent
              activity, or if required for security or legal reasons. You may stop using the platform at any time.
            </p>

            <h2 className="text-xl font-bold text-foreground">Governing Law</h2>
            <p>
              These Terms are governed by the laws of Kenya, without regard to conflict of law principles. Disputes shall
              be subject to the exclusive jurisdiction of the courts of Kenya, unless otherwise required by applicable
              law.
            </p>

            <h2 className="text-xl font-bold text-foreground">Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Updated Terms will be posted on this page with a revised
              effective date. Continued use of the platform after changes constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-xl font-bold text-foreground">Contact Us</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:info@aksharevents.com" className="text-primary hover:underline">
                info@aksharevents.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
