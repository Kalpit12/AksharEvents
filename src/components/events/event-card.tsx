import Link from "next/link";
import { ArrowRight, Calendar, Heart, MapPin, Sparkles } from "lucide-react";
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
  variant?: "grid" | "list" | "featured";
  className?: string;
  imagePriority?: boolean;
  eventsBasePath?: string;
}

function getMinPrice(ticketTypes: EventCardProps["event"]["ticketTypes"]) {
  if (!ticketTypes.length) return 0;
  return Math.min(
    ...ticketTypes.map((ticket) => {
      const price = ticket.price;
      return typeof price === "object" && price !== null && "toNumber" in price
        ? (price as { toNumber: () => number }).toNumber()
        : Number(price);
    })
  );
}

function formatEventFormat(format: EventFormat) {
  return format.replaceAll("_", " ");
}

export function EventCard({
  event,
  variant = "grid",
  className,
  imagePriority = false,
  eventsBasePath = "/events",
}: EventCardProps) {
  const eventHref = `${eventsBasePath}/${event.slug}`;
  const minPrice = getMinPrice(event.ticketTypes);
  const priceLabel = minPrice === 0 ? "Free entry" : `From ${formatCurrency(minPrice)}`;

  if (variant === "featured") {
    return (
      <Link href={eventHref} className={cn("group block h-full", className)}>
        <Card className="h-full overflow-hidden border-champagne/25 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="relative aspect-[16/9] overflow-hidden">
            <SafeImage
              src={event.banner}
              alt={event.title}
              fill
              priority={imagePriority}
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge variant="accent" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
              <Badge variant="default">{event.category.name}</Badge>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs font-medium uppercase tracking-wide text-white/75">
                {formatEventFormat(event.format)}
              </p>
              <h3 className="mt-1 text-lg font-bold leading-snug sm:text-xl">{event.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.startDate)}
                </span>
                {event.venue ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.venue.city}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-semibold text-champagne-dark">{priceLabel}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2">
              View event
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={eventHref} className={cn("group block", className)}>
        <Card className="overflow-hidden border-border/80 transition-all duration-300 hover:border-champagne/30 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-48 shrink-0 sm:h-auto sm:w-80">
              <SafeImage
                src={event.banner}
                alt={event.title}
                fill
                priority={imagePriority}
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/10" />
              {event.isFeatured ? (
                <Badge variant="accent" className="absolute left-3 top-3">
                  Featured
                </Badge>
              ) : null}
              <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
                {formatDate(event.startDate, "MMM d, yyyy")}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="default">{event.category.name}</Badge>
                <Badge variant="outline">{formatEventFormat(event.format)}</Badge>
              </div>
              <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                {event.title}
              </h3>
              {event.venue ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.venue.name ? `${event.venue.name}, ` : ""}
                  {event.venue.city}
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-semibold text-champagne-dark">{priceLabel}</span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {event._count ? (
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {event._count.favorites}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={eventHref} className={cn("group block h-full", className)}>
      <Card
        className={cn(
          "h-full overflow-hidden border-border/80 transition-all duration-300 hover:-translate-y-1 hover:border-champagne/30 hover:shadow-xl",
          className
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <SafeImage
            src={event.banner}
            alt={event.title}
            fill
            priority={imagePriority}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {event.isFeatured ? <Badge variant="accent">Featured</Badge> : null}
            <Badge variant="default">{event.category.name}</Badge>
          </div>
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
            {formatDate(event.startDate, "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatEventFormat(event.format)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-lg">
              {event.title}
            </h3>
            {event.venue ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {event.venue.city}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <span className="font-semibold text-champagne-dark">{priceLabel}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
