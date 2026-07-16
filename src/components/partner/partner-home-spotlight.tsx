"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/home/home-reveal";

const highlights = [
  {
    icon: Compass,
    title: "Discover what matters",
    body: "Technology expos, innovation summits, and networking events across Africa.",
  },
  {
    icon: CalendarDays,
    title: "Book in minutes",
    body: "Register, get your pass, and show up ready — secure checkout via HDFC.",
  },
  {
    icon: Sparkles,
    title: "Events that connect",
    body: "From startups to enterprises — find experiences built for your team.",
  },
] as const;

export function PartnerHomeSpotlight({
  partnerName,
  eventsHref,
  aboutHref,
  contactHref,
}: {
  partnerName: string;
  eventsHref: string;
  aboutHref: string;
  contactHref: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[var(--partner-secondary)] py-20 text-white sm:py-24">
      <div aria-hidden className="partner-spotlight-glow pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden
        className="partner-spotlight-ring pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="partner-spotlight-ring pointer-events-none absolute -left-10 bottom-8 h-40 w-40 rounded-full border"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[color-mix(in_oklab,var(--partner-primary)_85%,white)]">
            Powered by {partnerName}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Where innovation{" "}
            <span className="bg-gradient-to-r from-[var(--partner-primary)] via-white to-[var(--partner-primary)] bg-clip-text text-transparent">
              meets opportunity
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            Explore curated events from {partnerName} and the AxarEvents platform — all in one place.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {highlights.map((item, index) => (
            <Reveal key={item.title} delay={0.08 * (index + 1)}>
              <div className="partner-spotlight-card h-full rounded-2xl border p-6 backdrop-blur-sm transition-colors">
                <div className="partner-spotlight-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.28} className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button size="lg" className="gap-2 shadow-lg" asChild>
            <Link href={eventsHref}>
              Explore events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href={aboutHref}>About us</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-[color-mix(in_oklab,var(--partner-primary)_80%,white)] hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href={contactHref}>Contact</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
