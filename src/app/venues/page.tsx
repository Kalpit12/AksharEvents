import { prisma } from "@/lib/prisma";

import { isFrontendOnly } from "@/lib/frontend-only";

import { getMockVenues } from "@/lib/mock-data";

import { VenueCard } from "@/components/venues/venue-card";

import { VenuesMapSection } from "@/components/venues/venues-map-section";

import type { VenueMapPoint } from "@/components/venues/venues-map";

import type { Metadata } from "next";



export const metadata: Metadata = {

  title: "Event Venues",

  description: "Discover premium event venues across Kenya and Africa.",

};



export default async function VenuesPage() {

  const venues = isFrontendOnly()

    ? getMockVenues()

    : await prisma.venue.findMany({

        orderBy: [{ isPopular: "desc" }, { name: "asc" }],

        include: { _count: { select: { events: true } } },

      });



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

    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Event Venues</h1>

      <p className="text-muted-foreground mb-10">Premium venues for conferences, expos, and events</p>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {venues.map((venue) => (

          <VenueCard key={venue.id} venue={venue} />

        ))}

      </div>



      <VenuesMapSection venues={mapVenues} />

    </div>

  );

}

