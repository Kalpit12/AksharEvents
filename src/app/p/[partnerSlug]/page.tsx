import { notFound } from "next/navigation";
import { getPublishedEvents } from "@/lib/events";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";
import { withDbRetry } from "@/lib/prisma";
import { HomeHero } from "@/components/home/home-hero";
import type { HeroSlide } from "@/components/home/home-hero";
import { EventCard } from "@/components/events/event-card";
import { getHeroImageForEvent, DEFAULT_HERO_SLIDES } from "@/lib/hero-images";
import type { Metadata } from "next";

function buildHeroSlides(
  featuredEvents: Awaited<ReturnType<typeof getPublishedEvents>>["events"],
  upcomingEvents: Awaited<ReturnType<typeof getPublishedEvents>>["events"],
  eventsBasePath: string,
  eventsAnchor: string
): HeroSlide[] {
  const seen = new Set<string>();
  const ordered = [...featuredEvents, ...upcomingEvents].filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });

  const fromEvents: HeroSlide[] = ordered.slice(0, 8).map((event, index) => ({
    id: event.id,
    title: event.title,
    subtitle:
      event.shortDescription ||
      `${event.category.name} event in ${event.venue?.city || "Kenya"}`,
    image: event.banner || getHeroImageForEvent(event.category.slug, index),
    href: `${eventsBasePath}/${event.slug}`,
    cta: "View Event",
  }));

  if (fromEvents.length >= 1) return fromEvents;

  return DEFAULT_HERO_SLIDES.slice(0, 3).map((slide, index) => ({
    ...slide,
    id: `default-${index}`,
    href: eventsAnchor,
    cta: "Browse Events",
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}): Promise<Metadata> {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) return { title: "Partner" };

  return {
    title: partner.name,
    description: partner.tagline ?? `Events from ${partner.name}`,
  };
}

export default async function PartnerHomePage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const base = partnerPath(partner.slug);
  const eventsBasePath = `${base}/events`;
  const eventsAnchor = `${base}#events`;

  const [featured, upcoming] = await withDbRetry(async () => {
    const featuredResult = await getPublishedEvents({
      featured: true,
      limit: 8,
      partnerId: partner.id,
    });
    const upcomingResult = await getPublishedEvents({
      sort: "upcoming",
      limit: 48,
      partnerId: partner.id,
    });
    return [featuredResult, upcomingResult] as const;
  });

  const heroSlides = buildHeroSlides(
    featured.events,
    upcoming.events,
    eventsBasePath,
    eventsAnchor
  );

  return (
    <>
      <HomeHero
        slides={heroSlides}
        eyebrow={partner.tagline ?? partner.name}
        exploreEventsHref={eventsAnchor}
      />

      <section id="events" className="scroll-mt-20 bg-[var(--partner-background)] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold sm:text-3xl">Events</h2>

          {upcoming.events.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              No upcoming events at the moment. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  imagePriority={index < 3}
                  eventsBasePath={eventsBasePath}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
