import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { VenueShareButton } from "@/components/venues/venue-share-button";
import { Building2, MapPin, Users } from "lucide-react";
import type { VenueShareData } from "@/lib/venue-share";
import { cn } from "@/lib/utils";

export type VenueCardVenue = {
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
  isPopular?: boolean;
  _count: { events: number };
};

interface VenueCardProps {
  venue: VenueCardVenue;
  featured?: boolean;
  priority?: boolean;
  className?: string;
}

export function VenueCard({
  venue,
  featured = false,
  priority = false,
  className,
}: VenueCardProps) {
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
    <article
      className={cn(
        "group relative block h-full min-h-[240px] w-full overflow-hidden rounded-2xl",
        featured ? "min-h-[320px] sm:min-h-[400px] lg:min-h-[440px]" : "sm:min-h-[280px]",
        className
      )}
    >
      <Link href={`/venues/${venue.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">View {venue.name}</span>
      </Link>

      <SafeImage
        src={venue.images[0]}
        alt={venue.name}
        fill
        priority={priority}
        sizes={
          featured
            ? "(max-width: 768px) 100vw, 100vw"
            : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        }
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso via-espresso/45 to-espresso/10 transition-opacity duration-500 group-hover:from-espresso/90 group-hover:via-espresso/40" />

      <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
        <VenueShareButton venue={shareData} iconOnly />
      </div>

      {venue.isPopular ? (
        <span className="absolute left-3 top-3 z-20 rounded-full border border-champagne/40 bg-champagne/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-champagne-light backdrop-blur-md sm:left-4 sm:top-4 sm:text-xs">
          Popular
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6 lg:p-8">
        <h2
          className={cn(
            "font-bold text-white drop-shadow-sm transition-colors group-hover:text-champagne-light",
            featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-xl"
          )}
        >
          {venue.name}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-alabaster/85">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {venue.city}, {venue.country}
        </p>
        <div
          className={cn(
            "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-alabaster/75",
            featured && "sm:mt-4 sm:gap-x-6 sm:text-base"
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {venue.capacity.toLocaleString()} capacity
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {venue._count.events} {venue._count.events === 1 ? "event" : "events"}
          </span>
        </div>
        {featured && venue.description ? (
          <p className="mt-3 max-w-2xl line-clamp-2 text-sm text-alabaster/70 sm:mt-4 sm:text-base">
            {venue.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
