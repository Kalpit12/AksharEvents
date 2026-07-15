import { prisma } from "@/lib/prisma";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockVenues } from "@/lib/mock-data";
import { VenuesHero } from "@/components/venues/venues-hero";
import { VenuesGallery } from "@/components/venues/venues-gallery";
import { VenuesMapSection } from "@/components/venues/venues-map-section";
import type { VenueMapPoint } from "@/components/venues/venues-map";
import type { VenueCardVenue } from "@/components/venues/venue-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Venues",
  description: "Discover premium event venues across Kenya and Africa.",
};

export default async function VenuesPage() {
  const venuesRaw = isFrontendOnly()
    ? getMockVenues()
    : await prisma.venue.findMany({
        orderBy: [{ isPopular: "desc" }, { name: "asc" }],
        include: { _count: { select: { events: true } } },
      });

  const venues: VenueCardVenue[] = venuesRaw.map((venue) => ({
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    city: venue.city,
    country: venue.country,
    address: venue.address,
    capacity: venue.capacity,
    description: venue.description,
    images: venue.images,
    latitude: venue.latitude,
    longitude: venue.longitude,
    isPopular: venue.isPopular,
    _count: venue._count,
  }));

  const mapVenues: VenueMapPoint[] = venues
    .filter((venue) => venue.latitude != null && venue.longitude != null)
    .map((venue) => ({
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      address: venue.address,
      city: venue.city,
      latitude: venue.latitude!,
      longitude: venue.longitude!,
      image: venue.images[0] ?? "",
    }));

  return (
    <div>
      <VenuesHero />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <VenuesGallery venues={venues} />
        <VenuesMapSection venues={mapVenues} />
      </div>
    </div>
  );
}
