"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { VenueMapPoint } from "@/components/venues/venues-map";

const VenuesMap = dynamic(
  () => import("@/components/venues/venues-map").then((m) => m.VenuesMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-muted sm:h-[400px] lg:h-[480px]" />
    ),
  }
);

interface VenuesMapSectionProps {
  venues: VenueMapPoint[];
}

export function VenuesMapSection({ venues }: VenuesMapSectionProps) {
  if (venues.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Venue locations</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        All three venues across Nairobi — click a marker for directions on Google Maps.
      </p>
      <VenuesMap venues={venues} />
    </section>
  );
}
