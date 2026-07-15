"use client";

import { useMemo, useState } from "react";
import { VenueCard, type VenueCardVenue } from "@/components/venues/venue-card";
import { Reveal, RevealItem, RevealStagger } from "@/components/home/home-reveal";
import { cn } from "@/lib/utils";

interface VenuesGalleryProps {
  venues: VenueCardVenue[];
}

export function VenuesGallery({ venues }: VenuesGalleryProps) {
  const [city, setCity] = useState<string>("all");

  const cities = useMemo(() => {
    const unique = Array.from(new Set(venues.map((v) => v.city).filter(Boolean))).sort();
    return unique;
  }, [venues]);

  const filtered = useMemo(() => {
    if (city === "all") return venues;
    return venues.filter((v) => v.city === city);
  }, [venues, city]);

  const featured =
    filtered.find((v) => v.isPopular) ?? filtered[0] ?? null;
  const rest = featured
    ? filtered.filter((v) => v.id !== featured.id)
    : filtered;

  if (venues.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-muted/50 px-6 py-16 text-center text-muted-foreground">
        No venues listed yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {cities.length > 1 ? (
        <Reveal>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter venues by city">
            <FilterChip
              label="All"
              active={city === "all"}
              onClick={() => setCity("all")}
            />
            {cities.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={city === c}
                onClick={() => setCity(c)}
              />
            ))}
          </div>
        </Reveal>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/50 px-6 py-12 text-center text-muted-foreground">
          No venues in {city}.
        </p>
      ) : (
        <>
          {featured ? (
            <Reveal>
              <VenueCard venue={featured} featured priority />
            </Reveal>
          ) : null}

          {rest.length > 0 ? (
            <RevealStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
              {rest.map((venue, index) => {
                const wide = index % 5 === 0 || index % 5 === 3;
                return (
                  <RevealItem
                    key={venue.id}
                    className={cn(
                      "h-full min-h-[240px]",
                      wide ? "lg:col-span-7" : "lg:col-span-5"
                    )}
                  >
                    <VenueCard venue={venue} />
                  </RevealItem>
                );
              })}
            </RevealStagger>
          ) : null}
        </>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-champagne bg-champagne/15 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-champagne/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
