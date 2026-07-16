import Link from "next/link";
import { Calendar, MapPin, Heart, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { EventFormat } from "@prisma/client";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    banner: string | null;
    startDate: Date;
    format: EventFormat;
    isFeatured?: boolean;
    category: { name: string; slug: string };
    venue: { name?: string; city: string } | null;
    ticketTypes: { price: { toNumber?: () => number } | number | string }[];
    _count?: { favorites: number; reviews: number };
  };
  variant?: "grid" | "list";
  className?: string;
  imagePriority?: boolean;
  eventsBasePath?: string;
}

export function EventCard({
  event,
  variant = "grid",
  className,
  imagePriority = false,
  eventsBasePath = "/events",
}: EventCardProps) {
  const eventHref = `${eventsBasePath}/${event.slug}`;
  const minPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((t) => {
        const p = t.price;
        return typeof p === "object" && p !== null && "toNumber" in p
          ? (p as { toNumber: () => number }).toNumber()
          : Number(p);
      }))
    : 0;

  if (variant === "list") {
    return (
      <Link href={eventHref}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-48 sm:h-auto sm:w-72 shrink-0">
              <SafeImage
                src={event.banner}
                alt={event.title}
                fill
                priority={imagePriority}
                className="group-hover:scale-105 transition-transform duration-500"
              />
              {event.isFeatured && (
                <Badge variant="accent" className="absolute top-3 left-3">Featured</Badge>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{event.category.name}</Badge>
                <Badge variant="outline">{event.format.replace("_", " ")}</Badge>
              </div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{event.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(event.startDate)}</span>
                {event.venue && (
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.venue.city}</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-primary">
                  {minPrice === 0 ? "Free" : `From ${formatCurrency(minPrice)}`}
                </span>
                {event._count && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground/70">
                    <Heart className="h-4 w-4" />{event._count.favorites}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={eventHref}>
      <Card className={cn("group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", className)}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <SafeImage
            src={event.banner}
            alt={event.title}
            fill
            priority={imagePriority}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          {event.isFeatured && (
            <Badge variant="accent" className="absolute top-3 left-3">Featured</Badge>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <Badge variant="default" className="mb-2">{event.category.name}</Badge>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(event.startDate, "MMM d, yyyy")}
            </p>
            {event.venue && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {event.venue.city}
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-bold text-primary">
              {minPrice === 0 ? "Free" : `From ${formatCurrency(minPrice)}`}
            </span>
            <Badge variant="outline" className="text-xs">{event.format.replace("_", " ")}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
