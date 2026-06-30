import Link from "next/link";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getPublishedEvents } from "@/lib/events";
import { isFrontendOnly } from "@/lib/frontend-only";
import {
  getMockPopularVenues,
  getMockTestimonials,
} from "@/lib/mock-data";
import { HomeHero } from "@/components/home/home-hero";
import { UpcomingEventsCarousel } from "@/components/home/upcoming-events-carousel";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { TrustedOrganizations } from "@/components/home/trusted-organizations";
import { CategoryIcon } from "@/components/categories/category-icon";
import { getHeroImageForEvent, DEFAULT_HERO_SLIDES } from "@/lib/hero-images";
import type { HeroSlide } from "@/components/home/home-hero";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/utils";
import { ArrowRight, Star, Building2 } from "lucide-react";
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

  return padded.length > 0 ? padded : DEFAULT_HERO_SLIDES.map((slide, index) => ({
    ...slide,
    id: `default-${index}`,
  }));
}

export default async function HomePage() {
  const [featured, upcoming, venues, testimonials] = await withDbRetry(async () => {
    const featuredResult = await getPublishedEvents({ featured: true, limit: 8 });
    const upcomingResult = await getPublishedEvents({ sort: "upcoming", limit: 12 });
    const [venuesResult, testimonialsResult] = await Promise.all([
      isFrontendOnly()
        ? Promise.resolve(getMockPopularVenues(4))
        : prisma.venue.findMany({ where: { isPopular: true }, take: 4 }),
      isFrontendOnly()
        ? Promise.resolve(getMockTestimonials())
        : prisma.testimonial.findMany({ where: { isActive: true }, take: 3 }),
    ]);
    return [featuredResult, upcomingResult, venuesResult, testimonialsResult] as const;
  });

  const heroSlides = buildHeroSlides(featured.events, upcoming.events);

  return (
    <>
      <HomeHero slides={heroSlides} />

      {/* Categories */}
      <section className="py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold sm:text-3xl">Browse by Category</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories">View All <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-4 lg:grid-cols-9">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/events?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:gap-3 sm:p-4"
              >
                <CategoryIcon slug={cat.slug} size="md" />
                <span className="block max-w-full truncate text-center text-[10px] font-medium sm:text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcoming.events.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold sm:text-3xl">Upcoming Events</h2>
              <Button variant="ghost" asChild>
                <Link href="/events">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <UpcomingEventsCarousel events={serializeEventsForCarousel(upcoming.events)} />
          </div>
        </section>
      )}

      {/* Popular Venues */}
      {venues.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold sm:text-3xl">Popular Venues</h2>
              <Button variant="ghost" asChild>
                <Link href="/venues">View All <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {venues.map((venue) => (
                <Link key={venue.id} href={`/venues/${venue.slug}`} className="group rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all">
                  <div className="relative aspect-[16/10]">
                    <SafeImage src={venue.images[0]} alt={venue.name} fill />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{venue.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                      <Building2 className="h-3.5 w-3.5" />{venue.city} · {venue.capacity.toLocaleString()} capacity
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <TrustedOrganizations />

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">What People Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-2xl bg-card p-6 shadow-sm">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-champagne text-champagne" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">&ldquo;{t.content}&rdquo;</p>
                  <div className="mt-4">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}{t.company ? `, ${t.company}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterSignup />
    </>
  );
}
