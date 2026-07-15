"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { VenueMapPoint } from "@/components/venues/venues-map";
import { Reveal } from "@/components/home/home-reveal";

const VenuesMap = dynamic(
  () => import("@/components/venues/venues-map").then((m) => m.VenuesMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-2xl border border-border bg-muted sm:h-[440px] lg:h-[520px]" />
    ),
  }
);

interface VenuesMapSectionProps {
  venues: VenueMapPoint[];
}

export function VenuesMapSection({ venues }: VenuesMapSectionProps) {
  if (venues.length === 0) return null;

  const cities = Array.from(new Set(venues.map((v) => v.city).filter(Boolean)));
  const cityLabel =
    cities.length === 0
      ? "Kenya"
      : cities.length === 1
        ? cities[0]
        : cities.length === 2
          ? `${cities[0]} and ${cities[1]}`
          : `${cities.slice(0, -1).join(", ")}, and ${cities[cities.length - 1]}`;

  const countLabel =
    venues.length === 1
      ? "1 venue"
      : `${venues.length} venues`;

  return (
    <section className="mt-16 border-t border-border/70 pt-14 sm:mt-20 sm:pt-16">
      <Reveal>
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-champagne/15 text-champagne-dark">
            <MapPin className="h-4 w-4" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Explore on the map
          </h2>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          {countLabel} across {cityLabel}. Click a marker for details and Google Maps directions.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm ring-1 ring-champagne/10">
          <VenuesMap venues={venues} />
        </div>
      </Reveal>
    </section>
  );
}
