import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/events";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockCategories } from "@/lib/mock-data";
import { EventCard } from "@/components/events/event-card";
import { EventsFilters } from "@/components/events/events-filters";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";
import type { EventFormat } from "@prisma/client";

interface PartnerEventsPageProps {
  params: Promise<{ partnerSlug: string }>;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}): Promise<Metadata> {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  return { title: partner ? `Events — ${partner.name}` : "Events" };
}

export default async function PartnerEventsPage({
  params,
  searchParams,
}: PartnerEventsPageProps) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const base = partnerPath(partner.slug);
  const eventsBasePath = `${base}/events`;

  const paramsResolved = await searchParams;
  const page = parseInt(paramsResolved.page || "1");
  const limit = 12;
  const offset = (page - 1) * limit;
  const view = paramsResolved.view === "list" ? "list" : "grid";

  const [result, categories] = await Promise.all([
    getPublishedEvents({
      search: paramsResolved.search,
      categorySlug: paramsResolved.category,
      format: paramsResolved.format as EventFormat | undefined,
      city: paramsResolved.city,
      sort: (paramsResolved.sort as "upcoming" | "newest" | "popular") || "upcoming",
      limit,
      offset,
      partnerId: partner.id,
    }),
    isFrontendOnly()
      ? Promise.resolve(getMockCategories())
      : prisma.eventCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const queryPrefix = `${base}/events?`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Discover Events</h1>
        <p className="mt-2 text-muted-foreground">
          Browse platform and {partner.name} events in one place.
        </p>
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-muted" />}>
        <EventsFilters categories={categories} basePath={`${base}/events`} />
      </Suspense>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{result.total} events found</p>
        <div className="flex gap-2">
          <Link href={`${queryPrefix}${new URLSearchParams({ ...paramsResolved, view: "grid" } as Record<string, string>).toString()}`}>
            <Button variant={view === "grid" ? "default" : "outline"} size="sm">Grid</Button>
          </Link>
          <Link href={`${queryPrefix}${new URLSearchParams({ ...paramsResolved, view: "list" } as Record<string, string>).toString()}`}>
            <Button variant={view === "list" ? "default" : "outline"} size="sm">List</Button>
          </Link>
        </div>
      </div>

      {result.events.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">No events found matching your criteria.</p>
          <Button asChild className="mt-4">
            <Link href={`${base}/events`}>Clear Filters</Link>
          </Button>
        </div>
      ) : (
        <div className={`mt-6 ${view === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}`}>
          {result.events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              variant={view}
              imagePriority={page === 1 && index === 0}
              eventsBasePath={eventsBasePath}
            />
          ))}
        </div>
      )}

      {result.pages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`${queryPrefix}${new URLSearchParams({ ...paramsResolved, page: String(p) } as Record<string, string>).toString()}`}
            >
              <Button variant={p === page ? "default" : "outline"} size="sm">{p}</Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
