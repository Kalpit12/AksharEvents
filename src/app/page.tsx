import Link from "next/link";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/events";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockPopularVenues } from "@/lib/mock-data";
import { HomeHero } from "@/components/home/home-hero";
import { UpcomingEventsCarousel } from "@/components/home/upcoming-events-carousel";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { HomePlatformSpotlight } from "@/components/home/home-platform-spotlight";
import {
  AnimatedHeading,
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/home/home-reveal";
import { CategoryIcon } from "@/components/categories/category-icon";
import { getHeroImageForEvent, DEFAULT_HERO_SLIDES } from "@/lib/hero-images";
import type { HeroSlide } from "@/components/home/home-hero";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/utils";
import { ArrowRight, Building2 } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

function serializeEventsForCarousel(
  events: Awaited<ReturnType<typeof getPublishedEvents>>["events"]
) {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    banner: event.banner,
    startDate: event.startDate.toISOString(),
    format: event.format,
    isFeatured: event.isFeatured,
    category: event.category,
    venue: event.venue,
    ticketTypes: event.ticketTypes.map((t) => ({
      price:
        typeof t.price === "object" && t.price !== null && "toNumber" in t.price
          ? t.price.toNumber()
          : Number(t.price),
    })),
  }));
}

function buildHeroSlides(
  featuredEvents: Awaited<ReturnType<typeof getPublishedEvents>>["events"],
  upcomingEvents: Awaited<ReturnType<typeof getPublishedEvents>>["events"]
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
    href: `/events/${event.slug}`,
    cta: "View Event",
  }));

  if (fromEvents.length >= 4) return fromEvents;

  const seenTitles = new Set(fromEvents.map((slide) => slide.title.toLowerCase()));
  const padded = [...fromEvents];
  for (const [index, fallback] of DEFAULT_HERO_SLIDES.entries()) {
    if (padded.length >= 4) break;
    if (seenTitles.has(fallback.title.toLowerCase())) continue;
    padded.push({
      ...fallback,
      id: `default-${index}`,
    });
    seenTitles.add(fallback.title.toLowerCase());
  }

  return padded.length > 0
    ? padded
    : DEFAULT_HERO_SLIDES.map((slide, index) => ({
        ...slide,
        id: `default-${index}`,
      }));
}

export default async function HomePage() {
  const [featured, upcoming, venues] = await withDbRetry(async () => {
    const featuredResult = await getPublishedEvents({ featured: true, limit: 8, platformOnly: true });
    const upcomingResult = await getPublishedEvents({ sort: "upcoming", limit: 12, platformOnly: true });
    const venuesResult = isFrontendOnly()
      ? await Promise.resolve(getMockPopularVenues(4))
      : await prisma.venue.findMany({ where: { isPopular: true }, take: 4 });
    return [featuredResult, upcomingResult, venuesResult] as const;
  });

  const heroSlides = buildHeroSlides(featured.events, upcoming.events);

  return (
    <>
      <HomeHero slides={heroSlides} />

      <section className="bg-muted py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <AnimatedHeading className="text-2xl font-bold sm:text-3xl">
              Browse by Category
            </AnimatedHeading>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
          <RevealStagger className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-4 lg:grid-cols-9">
            {CATEGORIES.map((cat) => (
              <RevealItem key={cat.slug}>
                <Link
                  href={`/events?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-4"
                >
                  <CategoryIcon slug={cat.slug} size="md" />
                  <span className="block max-w-full truncate text-center text-[10px] font-medium sm:text-sm">
                    {cat.name}
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {upcoming.events.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <AnimatedHeading className="text-2xl font-bold sm:text-3xl">
                Upcoming Events
              </AnimatedHeading>
              <Button variant="ghost" asChild>
                <Link href="/events">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={0.1}>
              <UpcomingEventsCarousel events={serializeEventsForCarousel(upcoming.events)} />
            </Reveal>
          </div>
        </section>
      )}

      {venues.length > 0 && (
        <section className="bg-muted py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <AnimatedHeading className="text-2xl font-bold sm:text-3xl">
                Popular Venues
              </AnimatedHeading>
              <Button variant="ghost" asChild>
                <Link href="/venues">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {venues.map((venue) => (
                <RevealItem key={venue.id}>
                  <Link
                    href={`/venues/${venue.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl bg-card shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10]">
                      <SafeImage src={venue.images[0]} alt={venue.name} fill />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold transition-colors group-hover:text-primary">
                        {venue.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {venue.city} · {venue.capacity.toLocaleString()} capacity
                      </p>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>
      )}

      <HomePlatformSpotlight />

      <NewsletterSignup />
    </>
  );
}
