"use client";

import type { EventScheduleItemOption } from "@/lib/event-config-types";
import {
  TOUR_TRAVEL_STOP_LABELS,
  type SerializedTourTravelItinerary,
} from "@/lib/itinerary-types";
import {
  EventScheduleTimeline,
  toEventScheduleTimelineItems,
} from "@/components/events/event-schedule-timeline";
import { groupScheduleByDay } from "@/lib/event-master-aggregations";
import { cloudinaryFullSizeUrl } from "@/lib/cloudinary-display-url";
import { cn, formatDate } from "@/lib/utils";
import { Bus, CalendarDays, Clock, MapPin, Route, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EnlargedImage = { src: string; alt: string };

function ImageLightbox({ image, onClose }: { image: EnlargedImage; onClose: () => void }) {
  const displaySrc = cloudinaryFullSizeUrl(image.src);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Enlarged photo: ${image.alt}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed right-4 top-4 z-[101] rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        aria-label="Close photo"
      >
        <X className="h-6 w-6" />
      </button>
      <figure
        className="absolute inset-0 flex items-center justify-center p-3 pt-14 sm:p-6 sm:pt-16"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displaySrc}
          alt={image.alt}
          className="max-h-full max-w-full object-contain"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </figure>
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-white/60">
        {image.alt}
      </p>
    </div>
  );
}

function TourPlacePhoto({
  src,
  alt,
  onEnlarge,
}: {
  src: string;
  alt: string;
  onEnlarge: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEnlarge}
      className="group relative mt-0.5 h-20 w-28 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`View larger photo of ${alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        Tap to enlarge
      </span>
    </button>
  );
}

type Props = {
  itineraries: SerializedTourTravelItinerary[];
  scheduleItems: EventScheduleItemOption[];
};

export default function ExhibitorItineraryPanel({ itineraries, scheduleItems }: Props) {
  const [enlargedImage, setEnlargedImage] = useState<EnlargedImage | null>(null);

  const publishedItineraries = useMemo(
    () => itineraries.filter((row) => row.isPublished),
    [itineraries]
  );

  const eventScheduleByDay = useMemo(
    () => groupScheduleByDay(scheduleItems.filter((item) => item.isActive)),
    [scheduleItems]
  );

  const hasTours = publishedItineraries.length > 0;
  const hasEventSchedule = eventScheduleByDay.length > 0;
  const hasContent = hasTours || hasEventSchedule;

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Schedules coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tour, travel, and event schedules will appear here when published by the event team.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10">
        {hasTours ? (
          <section aria-labelledby="exhibitor-tours-heading">
            <header className="mb-5 border-b border-border/60 pb-4">
              <h2
                id="exhibitor-tours-heading"
                className="flex items-center gap-2 text-xl font-semibold tracking-tight"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/15 text-espresso">
                  <Bus className="h-5 w-5" />
                </span>
                Tours &amp; travel
              </h2>
              <p className="mt-1 pl-11 text-sm text-muted-foreground">
                Day-by-day routes, stops, and overnight stays
              </p>
            </header>

            <div className="space-y-6">
              {publishedItineraries.map((plan) => (
                <article key={plan.id} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold">{plan.title}</h3>

                  <div className="mt-4 space-y-4">
                    {plan.days.map((day) => (
                      <div key={day.id} className="rounded-xl border border-border/80 bg-muted/15 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-full bg-champagne/20 px-2.5 py-0.5 text-[11px] font-semibold text-espresso">
                            Day {day.dayIndex}
                          </span>
                          {day.title ? <span className="text-sm font-medium">{day.title}</span> : null}
                          {day.dayDate ? (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(day.dayDate, "EEE, MMM d")}
                            </span>
                          ) : null}
                        </div>
                        <ol className="space-y-2">
                          {day.stops.map((stop) => (
                            <li
                              key={stop.id}
                              className={cn(
                                "rounded-lg border border-border/60 bg-background px-3 py-2.5",
                                stop.stopType === "STAY" && "border-champagne/40 bg-champagne/5"
                              )}
                            >
                              <div className="flex gap-3">
                                {stop.placeImageUrl ? (
                                  <TourPlacePhoto
                                    src={stop.placeImageUrl}
                                    alt={stop.title}
                                    onEnlarge={() =>
                                      setEnlargedImage({ src: stop.placeImageUrl!, alt: stop.title })
                                    }
                                  />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                      {TOUR_TRAVEL_STOP_LABELS[stop.stopType]}
                                    </span>
                                    <span className="text-sm font-medium">{stop.title}</span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                    {stop.location ? (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {stop.location}
                                      </span>
                                    ) : null}
                                    {stop.startAt ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(stop.startAt, "MMM d · h:mm a")}
                                        {stop.endAt ? ` – ${formatDate(stop.endAt, "h:mm a")}` : ""}
                                      </span>
                                    ) : null}
                                  </div>
                                  {stop.notes ? (
                                    <p className="mt-1.5 text-xs text-muted-foreground">{stop.notes}</p>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hasTours && hasEventSchedule ? (
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <Route className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {hasEventSchedule ? (
          <section aria-labelledby="exhibitor-event-schedule-heading" className="rounded-2xl border border-border bg-card p-5">
            <header className="mb-5 border-b border-border/60 pb-4">
              <h2
                id="exhibitor-event-schedule-heading"
                className="flex items-center gap-2 text-xl font-semibold tracking-tight"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                Event schedule
              </h2>
              <p className="mt-1 pl-11 text-sm text-muted-foreground">
                Sessions, speakers, and on-site programme
              </p>
            </header>

            <div className="space-y-6">
              {eventScheduleByDay.map(({ day, items }) => (
                <div key={day}>
                  <span className="mb-3 inline-flex rounded-full bg-champagne/15 px-2.5 py-0.5 text-[11px] font-medium text-espresso">
                    {day}
                  </span>
                  <EventScheduleTimeline
                    items={toEventScheduleTimelineItems(items)}
                    onSpeakerImageClick={(src, alt) => setEnlargedImage({ src, alt })}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {enlargedImage ? (
        <ImageLightbox image={enlargedImage} onClose={() => setEnlargedImage(null)} />
      ) : null}
    </>
  );
}
