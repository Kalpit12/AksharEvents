"use client";

import { Reveal } from "@/components/home/home-reveal";

export function VenuesHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-espresso">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(197,168,128,0.28),_transparent_52%),radial-gradient(ellipse_at_bottom_left,_rgba(239,236,230,0.08),_transparent_48%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-champagne-light">
            Event venues
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Spaces worth{" "}
            <span className="bg-gradient-to-r from-champagne-light via-white to-champagne bg-clip-text text-transparent">
              gathering in
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-alabaster/75 sm:text-lg">
            Discover halls, centres, and landmark venues across Kenya — built for expos,
            conferences, and unforgettable audiences.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
