"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addTourTravelDay,
  addTourTravelStop,
  createTourTravelItinerary,
  deleteTourTravelStop,
  publishTourTravelItinerary,
  updateTourTravelItinerary,
} from "@/lib/itinerary-actions";
import {
  TOUR_TRAVEL_STOP_LABELS,
  type SerializedTourTravelDay,
  type SerializedTourTravelItinerary,
  type SerializedTourTravelStop,
} from "@/lib/itinerary-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { notify } from "@/lib/notify";
import { cn, formatDate } from "@/lib/utils";
import {
  Bus,
  ChevronDown,
  Hotel,
  MapPin,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import type { TourTravelStopType } from "@prisma/client";

type Props = {
  eventId: string;
  itineraries: SerializedTourTravelItinerary[];
  notifyExhibitorCount: number;
};

const STOP_TYPES: { value: TourTravelStopType; label: string; hint: string }[] = [
  { value: "START", label: "Departure", hint: "Leave from here" },
  { value: "STOP", label: "Stop", hint: "Break or visit" },
  { value: "STAY", label: "Overnight", hint: "Hotel or lodge" },
];

export default function TourTravelPlanner({ eventId, itineraries, notifyExhibitorCount }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(itineraries[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [addingStopDayId, setAddingStopDayId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && itineraries[0]) setSelectedId(itineraries[0].id);
    if (selectedId && !itineraries.some((row) => row.id === selectedId)) {
      setSelectedId(itineraries[0]?.id ?? "");
    }
  }, [itineraries, selectedId]);

  const selected = useMemo(
    () => itineraries.find((row) => row.id === selectedId) ?? null,
    [itineraries, selectedId]
  );

  const run = async (
    fn: () => Promise<{ error?: string; message?: string } | void>
  ) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result && "error" in result && result.error) {
        notify.error(result.error);
        return;
      }
      notify.success(result && "message" in result && result.message ? result.message : "Saved");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) {
      notify.error("Enter a trip name first");
      return;
    }
    void run(async () => {
      const result = await createTourTravelItinerary({ eventId, title });
      if (result && "itinerary" in result && result.itinerary) {
        setSelectedId(result.itinerary.id);
        setNewTitle("");
        await addTourTravelDay({
          itineraryId: result.itinerary.id,
          dayIndex: 1,
          title: "Day 1",
        });
        return { message: "Trip created — add your first stop below" };
      }
      return result;
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Bus className="h-4 w-4 text-primary" />
          Tours &amp; travel schedule
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Build a trip plan and publish it. Only exhibitors who chose tours &amp; travel in
          registration ({notifyExhibitorCount}) will be notified.
        </p>
      </div>

      <ol className="mb-5 grid gap-2 sm:grid-cols-3">
        {[
          ["1", "Create or pick a trip"],
          ["2", "Add days & stops"],
          ["3", "Publish to exhibitors"],
        ].map(([step, label]) => (
          <li
            key={step}
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {step}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New trip name, e.g. Amboseli Safari"
          className="sm:flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" disabled={busy} className="gap-1.5 sm:shrink-0" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Create trip
        </Button>
      </div>

      {itineraries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
          No trips yet. Enter a name above and click Create trip.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {itineraries.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedId === plan.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {plan.title}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    selectedId === plan.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : plan.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                  )}
                >
                  {plan.isPublished ? "Live" : "Draft"}
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/15 px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium">{selected.title}</span>
                  <span className="ml-2 text-muted-foreground">
                    {selected.days.length} day{selected.days.length === 1 ? "" : "s"} ·{" "}
                    {selected.days.reduce((n, d) => n + d.stops.length, 0)} stops
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  disabled={busy || selected.isPublished}
                  onClick={() =>
                    void run(async () => {
                      const result = await publishTourTravelItinerary(selected.id, eventId);
                      if (result.error) return result;
                      const count = "count" in result ? result.count : 0;
                      return {
                        message: count
                          ? `Published — ${count} user${count === 1 ? "" : "s"} notified`
                          : "Published — no matching exhibitors to notify",
                      };
                    })
                  }
                >
                  <Send className="h-3.5 w-3.5" />
                  {selected.isPublished ? "Already published" : "Publish trip"}
                </Button>
              </div>

              <div className="rounded-xl border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                  onClick={() => setShowDetails((value) => !value)}
                >
                  <span>Trip details — vehicle, team size, hotel</span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", showDetails && "rotate-180")}
                  />
                </button>
                {showDetails ? (
                  <form
                    className="grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      void run(async () =>
                        updateTourTravelItinerary({
                          id: selected.id,
                          eventId,
                          title: String(fd.get("title") ?? selected.title),
                          description: String(fd.get("description") ?? "") || undefined,
                          vehicleInfo: String(fd.get("vehicleInfo") ?? "") || undefined,
                          memberCount: fd.get("memberCount") ? Number(fd.get("memberCount")) : undefined,
                          hotelInfo: String(fd.get("hotelInfo") ?? "") || undefined,
                        })
                      );
                    }}
                  >
                    <div className="sm:col-span-2">
                      <Label>Trip name</Label>
                      <Input name="title" defaultValue={selected.title} required className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="inline-flex items-center gap-1">
                        <Bus className="h-3.5 w-3.5" /> Vehicle
                      </Label>
                      <Input
                        name="vehicleInfo"
                        defaultValue={selected.vehicleInfo ?? ""}
                        placeholder="e.g. Mini bus KAA 123A"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Team size
                      </Label>
                      <Input
                        name="memberCount"
                        type="number"
                        min={0}
                        defaultValue={selected.memberCount ?? ""}
                        placeholder="e.g. 10"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="inline-flex items-center gap-1">
                        <Hotel className="h-3.5 w-3.5" /> Hotel / accommodation
                      </Label>
                      <Textarea
                        name="hotelInfo"
                        defaultValue={selected.hotelInfo ?? ""}
                        rows={2}
                        placeholder="Hotel name, check-in, rooming notes…"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Notes for exhibitors (optional)</Label>
                      <Textarea
                        name="description"
                        defaultValue={selected.description ?? ""}
                        rows={2}
                        placeholder="Short overview shown at the top of this trip"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" size="sm" disabled={busy}>
                        Save trip details
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">Day-by-day route</h4>
                    <p className="text-xs text-muted-foreground">
                      Add each day, then add departures, stops, and overnight stays in order.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={busy}
                    onClick={() => {
                      const nextDay = (selected.days.at(-1)?.dayIndex ?? 0) + 1;
                      void run(async () =>
                        addTourTravelDay({
                          itineraryId: selected.id,
                          dayIndex: nextDay,
                          title: `Day ${nextDay}`,
                        })
                      );
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add day
                  </Button>
                </div>

                {selected.days.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                    No days yet. Click &quot;Add day&quot; to start the route.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selected.days.map((day) => (
                      <DayCard
                        key={day.id}
                        day={day}
                        busy={busy}
                        isAddingStop={addingStopDayId === day.id}
                        onToggleAddStop={() =>
                          setAddingStopDayId((current) => (current === day.id ? null : day.id))
                        }
                        onDeleteStop={(stopId) =>
                          void run(async () => deleteTourTravelStop(stopId, eventId))
                        }
                        onAddStop={(fd) => {
                          void run(async () => {
                            const result = await addTourTravelStop({
                              dayId: day.id,
                              stopType: String(fd.get("stopType")) as TourTravelStopType,
                              title: String(fd.get("title") ?? ""),
                              location: String(fd.get("location") ?? "") || undefined,
                              startAt: String(fd.get("startAt") ?? "") || undefined,
                              notes: String(fd.get("notes") ?? "") || undefined,
                            });
                            setAddingStopDayId(null);
                            return result;
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

function DayCard({
  day,
  busy,
  isAddingStop,
  onToggleAddStop,
  onDeleteStop,
  onAddStop,
}: {
  day: SerializedTourTravelDay;
  busy: boolean;
  isAddingStop: boolean;
  onToggleAddStop: () => void;
  onDeleteStop: (stopId: string) => void;
  onAddStop: (fd: FormData) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span className="text-sm font-semibold">
          Day {day.dayIndex}
          {day.title && day.title !== `Day ${day.dayIndex}` ? ` — ${day.title}` : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {day.stops.length} stop{day.stops.length === 1 ? "" : "s"}
        </span>
      </div>

      {day.stops.length > 0 ? (
        <ol className="space-y-0 px-4 py-3">
          {day.stops.map((stop, index) => (
            <StopRow
              key={stop.id}
              stop={stop}
              isLast={index === day.stops.length - 1}
              busy={busy}
              onDelete={() => onDeleteStop(stop.id)}
            />
          ))}
        </ol>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground">No stops on this day yet.</p>
      )}

      <div className="border-t border-border/60 px-4 py-3">
        {isAddingStop ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onAddStop(new FormData(e.currentTarget));
              e.currentTarget.reset();
            }}
          >
            <div>
              <Label className="text-xs">What happens?</Label>
              <Input
                name="title"
                required
                placeholder="e.g. Leave Nairobi, Lunch break, Check in at hotel"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {STOP_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer flex-col items-center rounded-lg border border-border px-2 py-2 text-center has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="stopType"
                      value={type.value}
                      defaultChecked={type.value === "STOP"}
                      className="sr-only"
                    />
                    <span className="text-xs font-medium">{type.label}</span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">{type.hint}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Location</Label>
                <Input name="location" placeholder="City or venue" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Date &amp; time</Label>
                <Input name="startAt" type="datetime-local" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input name="notes" placeholder="Instructions for the group" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                Add stop
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onToggleAddStop}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onToggleAddStop}>
            <Plus className="h-3.5 w-3.5" />
            Add stop to Day {day.dayIndex}
          </Button>
        )}
      </div>
    </div>
  );
}

function StopRow({
  stop,
  isLast,
  busy,
  onDelete,
}: {
  stop: SerializedTourTravelStop;
  isLast: boolean;
  busy: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
            stop.stopType === "START" && "bg-sky-500",
            stop.stopType === "STOP" && "bg-amber-500",
            stop.stopType === "STAY" && "bg-emerald-500"
          )}
        />
        {!isLast ? <span className="my-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="mb-3 min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
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
                <span>{formatDate(stop.startAt, "MMM d · h:mm a")}</span>
              ) : null}
            </div>
            {stop.notes ? <p className="mt-1 text-xs text-muted-foreground">{stop.notes}</p> : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive"
            disabled={busy}
            onClick={onDelete}
            aria-label="Remove stop"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
