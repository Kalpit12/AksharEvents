"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { faqIntro, faqSections } from "@/lib/faq-content";
import { cn } from "@/lib/utils";

type FaqPageContentProps = {
  title?: string;
  subtitle?: string;
  showContactLink?: boolean;
  className?: string;
};

export function FaqPageContent({
  title = "Frequently Asked Questions",
  subtitle = faqIntro,
  showContactLink = true,
  className,
}: FaqPageContentProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const activeSection = faqSections.find((section) => section.id === activeSectionId);
  const activeSectionIndex = faqSections.findIndex((section) => section.id === activeSectionId);

  const selectSection = (sectionId: string) => {
    setActiveSectionId((current) => (current === sectionId ? null : sectionId));
    setOpenQuestion(null);
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestion((current) => (current === question ? null : question));
  };

  return (
    <div className={cn(className)}>
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
          <HelpCircle className="h-3.5 w-3.5" />
          Help centre
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
        ) : null}
      </div>

      <nav
        aria-label="FAQ sections"
        className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-sm"
      >
        {faqSections.map((section, index) => {
          const isActive = activeSectionId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => selectSection(section.id)}
              aria-expanded={isActive}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-champagne bg-champagne/15 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-champagne/40 hover:text-foreground"
              )}
            >
              {index + 1}. {section.title}
            </button>
          );
        })}
      </nav>

      {!activeSection ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-14 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-champagne-dark/70" />
          <p className="mt-4 text-sm font-medium text-foreground">Select a topic above</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a category to view related questions and answers.
          </p>
        </div>
      ) : (
        <section
          key={activeSection.id}
          id={activeSection.id}
          className="scroll-mt-24 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm dark:border-champagne/15 sm:p-8"
        >
          <div className="mb-6 border-b border-border/60 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-champagne-dark">
              {String(activeSectionIndex + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {activeSection.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{activeSection.description}</p>
          </div>

          <div className="space-y-3">
            {activeSection.faqs.map((item) => {
              const isOpen = openQuestion === item.q;
              return (
                <div
                  key={item.q}
                  className={cn(
                    "rounded-xl border border-border/70 bg-background/60 transition-colors",
                    isOpen && "border-champagne/30 bg-champagne/5"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(item.q)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left text-sm font-semibold leading-snug text-foreground sm:text-base"
                  >
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 shrink-0 text-lg leading-none text-champagne-dark transition-transform",
                        isOpen && "rotate-45"
                      )}
                    >
                      +
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border/50 px-4 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showContactLink ? (
        <div className="mt-10 rounded-2xl border border-champagne/25 bg-champagne/10 p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team can help with bookings, exhibitor access, and partner sites.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-champagne px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Contact us
          </Link>
        </div>
      ) : null}
    </div>
  );
}
