"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Globe,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import { faqIntro, faqSections } from "@/lib/faq-content";
import { cn } from "@/lib/utils";

type FaqPageContentProps = {
  title?: string;
  subtitle?: string;
  showContactLink?: boolean;
  className?: string;
};

const sectionIcons = {
  general: Globe,
  "visitor-badges": BadgeCheck,
  "event-information": CalendarDays,
  payments: CreditCard,
  exhibitors: Building2,
  "partner-organisers": LayoutDashboard,
  "event-management": Briefcase,
  support: Headphones,
  "privacy-security": Shield,
  "why-axarevents": Star,
} as const;

const sectionAccent = {
  general: "bg-sky-100 text-sky-700",
  "visitor-badges": "bg-violet-100 text-violet-700",
  "event-information": "bg-blue-100 text-blue-700",
  payments: "bg-emerald-100 text-emerald-700",
  exhibitors: "bg-amber-100 text-amber-800",
  "partner-organisers": "bg-orange-100 text-orange-800",
  "event-management": "bg-rose-100 text-rose-700",
  support: "bg-cyan-100 text-cyan-800",
  "privacy-security": "bg-slate-200 text-slate-700",
  "why-axarevents": "bg-champagne/25 text-champagne-dark",
} as const;

export function FaqPageContent({
  title = "Help Center",
  subtitle = faqIntro,
  showContactLink = true,
  className,
}: FaqPageContentProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const activeSection = faqSections.find((section) => section.id === activeSectionId);
  const ActiveIcon =
    activeSection && activeSection.id in sectionIcons
      ? sectionIcons[activeSection.id as keyof typeof sectionIcons]
      : HelpCircle;

  const openSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setOpenQuestion(null);
  };

  const closeSection = () => {
    setActiveSectionId(null);
    setOpenQuestion(null);
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestion((current) => (current === question ? null : question));
  };

  return (
    <div className={cn(className)}>
      <div className="mb-10 text-center sm:mb-12">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
          <Sparkles className="h-3.5 w-3.5" />
          Help centre
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {!activeSection ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faqSections.map((section) => {
            const Icon = sectionIcons[section.id as keyof typeof sectionIcons] ?? HelpCircle;
            const accent =
              sectionAccent[section.id as keyof typeof sectionAccent] ??
              "bg-champagne/20 text-champagne-dark";

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => openSection(section.id)}
                className="group flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne/40 hover:shadow-md sm:p-6"
              >
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                    accent
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {section.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-medium text-champagne-dark">
                  <span>
                    {section.faqs.length} question{section.faqs.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
                    Browse
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={closeSection}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all topics
          </button>

          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
            <div className="border-b border-border/60 bg-muted/30 px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    sectionAccent[activeSection.id as keyof typeof sectionAccent] ??
                      "bg-champagne/20 text-champagne-dark"
                  )}
                >
                  <ActiveIcon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {activeSection.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{activeSection.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              {activeSection.faqs.map((item) => {
                const isOpen = openQuestion === item.q;
                return (
                  <div key={item.q} className={cn(isOpen && "bg-champagne/5")}>
                    <button
                      type="button"
                      onClick={() => toggleQuestion(item.q)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/30 sm:px-8"
                    >
                      <span className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                        {item.q}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-sm leading-none text-champagne-dark transition-transform",
                          isOpen && "rotate-45 border-champagne/40 bg-champagne/15"
                        )}
                      >
                        +
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border/40 px-6 pb-5 pt-1 text-sm leading-relaxed text-muted-foreground sm:px-8">
                        <p className="pt-3">{item.a}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showContactLink ? (
        <div className="mt-12 rounded-2xl border border-champagne/25 bg-gradient-to-br from-champagne/15 to-transparent p-6 text-center sm:p-8">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-champagne/20 text-champagne-dark">
            <Headphones className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Still need help?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Our team can help with bookings, exhibitor access, partner sites, and technical support.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-champagne px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Contact us
          </Link>
        </div>
      ) : null}
    </div>
  );
}
