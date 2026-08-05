import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { MICE_EXAMPLES, MICE_TAGLINE } from "@/lib/mice-content";
import { Button } from "@/components/ui/Button";

export function VenuesMiceSection() {
  return (
    <section className="mb-12 rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-champagne-dark">
            <Briefcase className="h-3.5 w-3.5" />
            MICE-capable venues
          </p>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Halls and centres built for business gatherings
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {MICE_TAGLINE} Listed venues on AxarEvents are suited for meetings, conferences,
            expos, and corporate programs — alongside community and cultural use where applicable.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {MICE_EXAMPLES.map((example) => (
              <li key={example} className="text-sm text-muted-foreground">
                · {example}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Button asChild className="bg-champagne text-primary-foreground hover:opacity-90">
            <Link href="/booking-inquiries">
              Plan an event
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">What is MICE?</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
