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
    body: "Career fairs, expos, and conferences curated for Kenya and Africa.",
  },
  {
    icon: CalendarDays,
    title: "Book in minutes",
    body: "Register, get your pass, and show up ready — no queues of guesswork.",
  },
  {
    icon: Sparkles,
    title: "Built for exhibitors too",
    body: "Manage teams, booths, and brandings from one modern portal.",
  },
] as const;

export function HomePlatformSpotlight() {
  return (
    <section className="relative overflow-hidden bg-espresso py-20 text-alabaster sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(197,168,128,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(239,236,230,0.08),_transparent_50%)]"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-champagne/20"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-8 h-40 w-40 rounded-full border border-champagne/15"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-champagne-light">
            A new stage for events
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Where Kenya&apos;s next experiences{" "}
            <span className="bg-gradient-to-r from-champagne-light via-white to-champagne bg-clip-text text-transparent">
              take the spotlight
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-alabaster/75 sm:text-lg">
            AxarEvents is freshly launched — a modern home for discovering events and
            running exhibitor workflows with clarity.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {highlights.map((item, index) => (
            <Reveal key={item.title} delay={0.08 * (index + 1)}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-champagne/35 hover:bg-white/[0.08]">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-champagne/15 text-champagne-light">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-alabaster/70">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.28} className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button size="lg" className="gap-2 shadow-lg" asChild>
            <Link href="/events">
              Explore events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/25 bg-white/5 text-white hover:bg-white/15"
            asChild
          >
            <Link href="/auth/exhibitor">Exhibitor portal</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-champagne-light hover:bg-white/5 hover:text-white"
            asChild
          >
            <Link href="/booking-inquiries">Booking &amp; inquiries</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
