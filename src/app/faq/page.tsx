import { AboutBackground } from "@/components/about/about-background";
import { faqSections } from "@/lib/faq-content";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND.name} — ticketing and the exhibitor portal.`,
};

export default function FAQPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <HelpCircle className="h-3.5 w-3.5" />
            Help centre
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-muted-foreground">
            Answers about event booking and the Exhibitor Portal.
          </p>
        </div>

        <nav
          aria-label="FAQ sections"
          className="mb-10 flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm dark:border-champagne/15"
        >
          {faqSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {faqSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{section.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              </div>

              <div className="space-y-4">
                {section.faqs.map((faq) => (
                  <article
                    key={faq.q}
                    className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm dark:border-champagne/15"
                  >
                    <h3 className="text-lg font-semibold">{faq.q}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{faq.a}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm dark:border-champagne/15 sm:p-8">
          <h2 className="text-lg font-semibold">Need more detail?</h2>
          <p className="mt-2 text-muted-foreground">
            Download the portal features guide for a full overview of exhibitor workflows.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/axar-events-portal-features.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Portal features guide (PDF)
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
