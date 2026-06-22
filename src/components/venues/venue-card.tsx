import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { VenueShareButton } from "@/components/venues/venue-share-button";
import { Building2, MapPin, Users } from "lucide-react";
import type { VenueShareData } from "@/lib/venue-share";

interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    address: string;
    capacity: number;
    description: string;
    images: string[];
    latitude?: number | null;
    longitude?: number | null;
    _count: { events: number };
  };
}

export function VenueCard({ venue }: VenueCardProps) {
  const shareData: VenueShareData = {
    name: venue.name,
    slug: venue.slug,
    address: venue.address,
    city: venue.city,
    country: venue.country,
    capacity: venue.capacity,
    description: venue.description,
    latitude: venue.latitude,
    longitude: venue.longitude,
  };

  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card text-card-foreground hover:shadow-lg transition-all">
      <Link href={`/venues/${venue.slug}`} className="block">
        <div className="relative aspect-[16/10]">
          <SafeImage src={venue.images[0]} alt={venue.name} fill />
        </div>
        <div className="p-5 pb-3">
          <h2 className="text-lg font-bold group-hover:text-primary transition-colors">{venue.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {venue.city}, {venue.country}
          </p>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {venue.capacity.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {venue._count.events} events
            </span>
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5 mt-auto">
        <VenueShareButton venue={shareData} className="w-full" />
      </div>
    </article>
  );
}
