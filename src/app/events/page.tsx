import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkles, Ticket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/events";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockCategories } from "@/lib/mock-data";
import { EventCard } from "@/components/events/event-card";
import { EventsFilters, EventsViewToggle } from "@/components/events/events-filters";
import { AboutBackground } from "@/components/about/about-background";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";
import type { EventFormat } from "@prisma/client";

export const metadata: Metadata = {
  title: "Browse Events",
  description: "Discover career fairs, conferences, expos, and events across Kenya and Africa.",
};

interface EventsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    format?: string;
    city?: string;
    sort?: string;
    view?: string;
    page?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;
  const offset = (page - 1) * limit;
  const view = params.view === "list" ? "list" : "grid";
  const hasActiveFilters = Boolean(
    params.search || params.category || params.format || params.city || params.sort
  );

  const [result, categories, featuredResult] = await Promise.all([
    getPublishedEvents({
      search: params.search,
      categorySlug: params.category,
      format: params.format as EventFormat | undefined,
      city: params.city,
      sort: (params.sort as "upcoming" | "newest" | "popular") || "upcoming",
      limit,
      offset,
      platformOnly: true,
    }),
    isFrontendOnly()
      ? Promise.resolve(getMockCategories())
      : prisma.eventCategory.findMany({ orderBy: { name: "asc" } }),
    page === 1 && !hasActiveFilters
      ? getPublishedEvents({ featured: true, limit: 3, platformOnly: true })
      : Promise.resolve({ events: [], total: 0, pages: 0 }),
  ]);

  const filterParams = {
    search: params.search,
    category: params.category,
    format: params.format,
    city: params.city,
    sort: params.sort,
    view: params.view,
    page: params.page,
  };

  const featuredIds = new Set(featuredResult.events.map((event) => event.id));
  const displayEvents =
    page === 1 && featuredIds.size > 0
      ? result.events.filter((event) => !featuredIds.has(event.id))
      : result.events;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <Sparkles className="h-3.5 w-3.5" />
            Discover events
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Browse Events
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Find career fairs, conferences, university events, expos, and networking opportunities
            across Kenya and Africa.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
              <p className="text-2xl font-bold tracking-tight">{result.total}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Events found
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
              <CalendarDays className="mx-auto h-5 w-5 text-champagne-dark" />
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Upcoming
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
              <Ticket className="mx-auto h-5 w-5 text-champagne-dark" />
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Visitor badges
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
              <MapPin className="mx-auto h-5 w-5 text-champagne-dark" />
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Across Africa
              </p>
            </div>
          </div>
        </section>

        <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-muted/60" />}>
          <EventsFilters categories={categories} />
        </Suspense>

        {featuredResult.events.length > 0 ? (
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-champagne-dark">
                  Spotlight
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">Featured events</h2>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredResult.events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="featured"
                  imagePriority={index === 0}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {Math.max(result.pages, 1)} · {result.total} event
            {result.total === 1 ? "" : "s"}
          </p>
          <EventsViewToggle view={view} params={filterParams} />
        </div>

        {displayEvents.length === 0 && featuredResult.events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-card/70 px-6 py-16 text-center backdrop-blur-sm">
            <CalendarDays className="mx-auto h-10 w-10 text-champagne-dark/70" />
            <p className="mt-4 text-lg font-semibold">No events found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters to discover more events.
            </p>
            <Button asChild className="mt-5 bg-champagne text-primary-foreground hover:opacity-90">
              <Link href="/events">Clear filters</Link>
            </Button>
          </div>
        ) : (
          <div
            className={
              view === "grid"
                ? "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                : "mt-6 flex flex-col gap-4"
            }
          >
            {displayEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                variant={view}
                imagePriority={page === 1 && index === 0 && featuredResult.events.length === 0}
              />
            ))}
          </div>
        )}

        {result.pages > 1 ? (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {Array.from({ length: result.pages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={`?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(filterParams).filter(([, value]) => value) as [string, string][]
                  ),
                  page: String(pageNumber),
                }).toString()}`}
              >
                <Button variant={pageNumber === page ? "default" : "outline"} size="sm">
                  {pageNumber}
                </Button>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
