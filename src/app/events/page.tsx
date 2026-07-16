import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/events";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockCategories } from "@/lib/mock-data";
import { EventCard } from "@/components/events/event-card";
import { EventsFilters } from "@/components/events/events-filters";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
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

  const [result, categories] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Discover Events</h1>
        <p className="mt-2 text-muted-foreground">
          Find career fairs, conferences, university events, and more across Kenya and Africa.
        </p>
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
        <EventsFilters categories={categories} />
      </Suspense>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{result.total} events found</p>
        <div className="flex gap-2">
          <Link href={`?${new URLSearchParams({ ...params, view: "grid" } as Record<string, string>).toString()}`}>
            <Button variant={view === "grid" ? "default" : "outline"} size="sm">Grid</Button>
          </Link>
          <Link href={`?${new URLSearchParams({ ...params, view: "list" } as Record<string, string>).toString()}`}>
            <Button variant={view === "list" ? "default" : "outline"} size="sm">List</Button>
          </Link>
        </div>
      </div>

      {result.events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No events found matching your criteria.</p>
          <Button asChild className="mt-4">
            <Link href="/events">Clear Filters</Link>
          </Button>
        </div>
      ) : (
        <div className={`mt-6 ${view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}`}>
          {result.events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              variant={view}
              imagePriority={page === 1 && index === 0}
            />
          ))}
        </div>
      )}

      {result.pages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?${new URLSearchParams({ ...params, page: String(p) } as Record<string, string>).toString()}`}>
              <Button variant={p === page ? "default" : "outline"} size="sm">{p}</Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
