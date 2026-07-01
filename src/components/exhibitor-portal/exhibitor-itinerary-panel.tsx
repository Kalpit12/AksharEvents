"use client";

import type { EventScheduleItemOption } from "@/lib/event-config-types";
import {
  TOUR_TRAVEL_STOP_LABELS,
  type SerializedTourTravelItinerary,
} from "@/lib/itinerary-types";
import { groupScheduleByDay } from "@/lib/event-master-aggregations";
import { cn, formatDate } from "@/lib/utils";
import { Bus, CalendarDays, Clock, Hotel, MapPin, Users } from "lucide-react";
import { useMemo } from "react";

type Props = {
  itineraries: SerializedTourTravelItinerary[];
  scheduleItems: EventScheduleItemOption[];
};

export default function ExhibitorItineraryPanel({ itineraries, scheduleItems }: Props) {
  const publishedItineraries = useMemo(
    () => itineraries.filter((row) => row.isPublished),
    [itineraries]
  );

  const eventScheduleByDay = useMemo(
    () => groupScheduleByDay(scheduleItems.filter((item) => item.isActive)),
    [scheduleItems]
  );

  const hasContent = publishedItineraries.length > 0 || eventScheduleByDay.length > 0;

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
    <div className="space-y-6">
      {publishedItineraries.map((plan) => (
        <section key={plan.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{plan.title}</h2>
            {plan.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {plan.vehicleInfo ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Bus className="h-3.5 w-3.5" />
                  {plan.vehicleInfo}
                </span>
              ) : null}
              {plan.memberCount != null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Users className="h-3.5 w-3.5" />
                  {plan.memberCount} members
                </span>
              ) : null}
              {plan.hotelInfo ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Hotel className="h-3.5 w-3.5" />
                  {plan.hotelInfo}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
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
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ))}

      {eventScheduleByDay.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Event schedule
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {eventScheduleByDay.map(({ day, items }) => (
              <div key={day} className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="mb-3 inline-flex rounded-full bg-champagne/15 px-2.5 py-0.5 text-[11px] font-medium text-espresso">
                  {day}
                </span>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.startAt, "h:mm a")}
                          {item.endAt ? ` – ${formatDate(item.endAt, "h:mm a")}` : ""}
                          {item.location ? ` · ${item.location}` : ""}
                        </div>
                        {item.description ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
