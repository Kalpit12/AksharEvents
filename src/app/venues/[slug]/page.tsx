import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockVenueBySlug } from "@/lib/mock-data";
import ImageSlider from "@/components/ui/ImageSlider";
import { EventCard } from "@/components/events/event-card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Users, Car, Accessibility } from "lucide-react";
import type { Metadata } from "next";

interface VenuePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = isFrontendOnly()
    ? getMockVenueBySlug(slug)
    : await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return { title: "Venue Not Found" };
  return { title: venue.name, description: venue.description.slice(0, 160) };
}

export default async function VenueDetailPage({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = isFrontendOnly()
    ? getMockVenueBySlug(slug)
    : await prisma.venue.findUnique({
        where: { slug },
        include: {
          events: {
            where: { status: "PUBLISHED", startDate: { gte: new Date() } },
            include: {
              category: true,
              venue: { select: { name: true, city: true } },
              ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" } },
            },
            take: 6,
          },
        },
      });

  if (!venue) notFound();

  return (
    <div>
      <ImageSlider
        images={venue.images.map((src) => ({ src, alt: venue.name }))}
        heightClass="h-[40vh] min-h-[300px]"
        fit="cover"
        priority
        overlay={
          <>
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-espresso/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-12 sm:p-6 sm:pb-14 lg:p-8 lg:pb-16">
              <div className="mx-auto max-w-7xl">
                <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{venue.name}</h1>
                <p className="mt-2 flex items-start gap-2 text-sm text-alabaster/80 sm:items-center sm:text-base">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />{venue.address}, {venue.city}
                </p>
              </div>
            </div>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">About</h2>
              <p className="text-muted-foreground">{venue.description}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Facilities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.facilities.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </section>

            {venue.parkingInfo && (
              <section className="flex gap-3">
                <Car className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Parking</h3>
                  <p className="text-sm text-muted-foreground">{venue.parkingInfo}</p>
                </div>
              </section>
            )}

            {venue.accessibility && (
              <section className="flex gap-3">
                <Accessibility className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Accessibility</h3>
                  <p className="text-sm text-muted-foreground">{venue.accessibility}</p>
                </div>
              </section>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Capacity</p>
                <p className="text-2xl font-bold">{venue.capacity.toLocaleString()}</p>
              </div>
            </div>
            {venue.latitude && venue.longitude && (
              <a
                href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View on Google Maps →
              </a>
            )}
          </div>
        </div>

        {"events" in venue && venue.events.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venue.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
