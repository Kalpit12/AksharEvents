"use client";

import { useMemo } from "react";
import LogoLoop, { type LogoItem } from "@/components/ui/LogoLoop";
import { TRUSTED_PARTNERS } from "@/lib/trusted-partners";
import { Reveal } from "@/components/home/home-reveal";

export function TrustedOrganizations() {
  const logos = useMemo<LogoItem[]>(
    () =>
      TRUSTED_PARTNERS.map((partner) => ({
        node: (
          <span className="inline-flex items-center whitespace-nowrap rounded-xl border border-border bg-card/90 px-5 py-2.5 text-sm font-semibold tracking-wide text-foreground shadow-sm backdrop-blur-sm">
            {partner.name}
          </span>
        ),
        title: partner.name,
        href: partner.website,
        ariaLabel: partner.name,
      })),
    []
  );

  return (
    <section className="border-y border-border bg-muted py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trusted by Leading Organizations
          </p>
        </Reveal>
        <div className="relative h-[72px] overflow-hidden">
          <LogoLoop
            logos={logos}
            speed={90}
            direction="left"
            logoHeight={40}
            gap={24}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="var(--color-muted)"
            ariaLabel="Trusted Kenyan partner organizations"
          />
        </div>
      </div>
    </section>
  );
}
