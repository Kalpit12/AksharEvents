"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addTourTravelDay,
  addTourTravelStopFromForm,
  createTourTravelItinerary,
  deleteTourTravelStop,
  importTourTravelFromUpload,
  publishTourTravelItinerary,
  updateTourTravelItinerary,
  updateTourTravelStopFromForm,
} from "@/lib/itinerary-actions";
import { ScheduleFileUpload } from "@/components/event-master/schedule-file-upload";
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
import {
  EVENT_SCHEDULE_SPEAKER_PHOTO_ACCEPT,
  EVENT_SCHEDULE_SPEAKER_PHOTO_MIME,
  MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES,
} from "@/lib/event-schedule-speaker-photo-constants";
import { cn, formatDate } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Bus,
  ChevronDown,
  Hotel,
  MapPin,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
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
  const [editingStop, setEditingStop] = useState<{ dayId: string; stopId: string } | null>(null);

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

  const run = async <T extends { error?: string; message?: string; stopId?: string } | void>(
    fn: () => Promise<T>
  ): Promise<T | void> => {
    setBusy(true);
    try {
      const result = await fn();
      if (result && "error" in result && result.error) {
        notify.error(result.error);
        return result;
      }
      notify.success(result && "message" in result && result.message ? result.message : "Saved");
      router.refresh();
      return result;
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

      <ScheduleFileUpload
        eventId={eventId}
        kind="tour-travel"
        replaceItineraryId={selectedId || null}
        disabled={busy}
        onImport={async (formData) => {
          const result = await importTourTravelFromUpload(formData);
          if (result.error) {
            notify.error(result.error);
            return { error: result.error };
          }
          if ("itineraryId" in result && result.itineraryId) {
            setSelectedId(result.itineraryId);
          }
          notify.success(result.message ?? "Schedule imported");
          router.refresh();
          return { message: result.message };
        }}
      />

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
                      Add stops, then click Edit on each row to set the photo, time, and place details.
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
                        editingStopId={editingStop?.dayId === day.id ? editingStop.stopId : null}
                        isAddingStop={addingStopDayId === day.id}
                        onToggleAddStop={() =>
                          setAddingStopDayId((current) => (current === day.id ? null : day.id))
                        }
                        onEditStop={(stopId) => setEditingStop({ dayId: day.id, stopId })}
                        onCancelEdit={() => setEditingStop(null)}
                        onDeleteStop={(stopId) => {
                          if (editingStop?.stopId === stopId) setEditingStop(null);
                          void run(async () => deleteTourTravelStop(stopId, eventId));
                        }}
                        onAddStop={async (formData) => {
                          formData.set("dayId", day.id);
                          const result = await run(async () => {
                            const addResult = await addTourTravelStopFromForm(formData);
                            if (addResult.error) return addResult;
                            setAddingStopDayId(null);
                            return {
                              message: "Stop added — add photo, time, and details below",
                              stopId: addResult.stopId,
                            };
                          });
                          if (result && "stopId" in result && result.stopId) {
                            setEditingStop({ dayId: day.id, stopId: result.stopId });
                          }
                        }}
                        onUpdateStop={async (formData) => {
                          formData.set("eventId", eventId);
                          const result = await run(async () => updateTourTravelStopFromForm(formData));
                          if (!result || !("error" in result) || !result.error) {
                            setEditingStop(null);
                          }
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

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function DayCard({
  day,
  busy,
  editingStopId,
  isAddingStop,
  onToggleAddStop,
  onEditStop,
  onCancelEdit,
  onDeleteStop,
  onAddStop,
  onUpdateStop,
}: {
  day: SerializedTourTravelDay;
  busy: boolean;
  editingStopId: string | null;
  isAddingStop: boolean;
  onToggleAddStop: () => void;
  onEditStop: (stopId: string) => void;
  onCancelEdit: () => void;
  onDeleteStop: (stopId: string) => void;
  onAddStop: (formData: FormData) => void | Promise<void>;
  onUpdateStop: (formData: FormData) => void | Promise<void>;
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
              isEditing={editingStopId === stop.id}
              onEdit={() => onEditStop(stop.id)}
              onCancelEdit={onCancelEdit}
              onDelete={() => onDeleteStop(stop.id)}
              onSave={(formData) => {
                formData.set("stopId", stop.id);
                void onUpdateStop(formData);
              }}
            />
          ))}
        </ol>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground">No stops on this day yet.</p>
      )}

      <div className="border-t border-border/60 px-4 py-3">
        {isAddingStop ? (
          <QuickAddStopForm
            busy={busy}
            onCancel={onToggleAddStop}
            onSubmit={(formData) => void onAddStop(formData)}
          />
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

function QuickAddStopForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(new FormData(e.currentTarget));
        e.currentTarget.reset();
      }}
    >
      <div className="flex-1">
        <Label className="text-xs">Place name</Label>
        <Input
          name="title"
          required
          placeholder="e.g. BAPS Dadar Mandir, Mumbai"
          className="mt-1"
        />
      </div>
      <div className="w-full sm:w-36">
        <Label className="text-xs">Type</Label>
        <select
          name="stopType"
          defaultValue="STOP"
          className="mt-1 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {STOP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditStopForm({
  stop,
  busy,
  onCancel,
  onSave,
}: {
  stop: SerializedTourTravelStop;
  busy: boolean;
  onCancel: () => void;
  onSave: (formData: FormData) => void | Promise<void>;
}) {
  const placePhotoRef = useRef<HTMLInputElement>(null);
  const [placePhotoName, setPlacePhotoName] = useState("");
  const [placePhotoPreview, setPlacePhotoPreview] = useState<string | null>(stop.placeImageUrl);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    return () => {
      if (placePhotoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(placePhotoPreview);
      }
    };
  }, [placePhotoPreview]);

  const clearNewPhoto = () => {
    if (placePhotoRef.current) placePhotoRef.current.value = "";
    setPlacePhotoName("");
    if (placePhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(placePhotoPreview);
    }
    setPlacePhotoPreview(stop.placeImageUrl);
    setRemovePhoto(false);
  };

  const handlePlacePhotoChange = (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES) {
      notify.error("Place photo must be 1 MB or smaller");
      clearNewPhoto();
      return;
    }

    if (!EVENT_SCHEDULE_SPEAKER_PHOTO_MIME.has(file.type)) {
      notify.error("Upload a JPG, PNG, or WEBP photo");
      clearNewPhoto();
      return;
    }

    if (placePhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(placePhotoPreview);
    }

    setPlacePhotoName(file.name);
    setPlacePhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const previewSrc = removePhoto ? null : placePhotoPreview;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (removePhoto) formData.set("removePlacePhoto", "true");
        void onSave(formData);
      }}
    >
      <div>
        <Label className="text-xs">Place name</Label>
        <Input name="title" required defaultValue={stop.title} className="mt-1" />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">Stop type</Label>
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
                defaultChecked={stop.stopType === type.value}
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
          <Label className="text-xs">Location (optional)</Label>
          <Input name="location" defaultValue={stop.location ?? ""} placeholder="City or landmark" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Date &amp; time (optional)</Label>
          <Input
            name="startAt"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(stop.startAt)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Details about this place</Label>
        <Textarea
          name="notes"
          rows={2}
          defaultValue={stop.notes ?? ""}
          placeholder="Visiting info, rest stops, instructions…"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Place photo (optional)</Label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {previewSrc ? (
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="Place" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">
              No photo
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor={`tour-place-photo-${stop.id}`}
              className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {placePhotoName || "Upload JPG, PNG, or WEBP · max 1 MB"}
              </span>
              <input
                ref={placePhotoRef}
                id={`tour-place-photo-${stop.id}`}
                name="placePhoto"
                type="file"
                accept={EVENT_SCHEDULE_SPEAKER_PHOTO_ACCEPT}
                className="sr-only"
                onChange={(e) => handlePlacePhotoChange(e.target.files?.[0])}
              />
            </label>
            {(stop.placeImageUrl || placePhotoName) && !removePhoto ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearNewPhoto();
                  setRemovePhoto(true);
                  setPlacePhotoPreview(null);
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Save stop
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function StopRow({
  stop,
  isLast,
  busy,
  isEditing,
  onEdit,
  onCancelEdit,
  onDelete,
  onSave,
}: {
  stop: SerializedTourTravelStop;
  isLast: boolean;
  busy: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSave: (formData: FormData) => void | Promise<void>;
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
        {isEditing ? (
          <EditStopForm stop={stop} busy={busy} onCancel={onCancelEdit} onSave={onSave} />
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 gap-3">
              {stop.placeImageUrl ? (
                <div className="relative mt-0.5 h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <SafeImage src={stop.placeImageUrl} alt={stop.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="mt-0.5 flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/30 text-[10px] text-muted-foreground">
                  No photo
                </div>
              )}
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
                  ) : (
                    <span className="italic">No time set</span>
                  )}
                </div>
                {stop.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{stop.notes}</p>
                ) : (
                  <p className="mt-1 text-xs italic text-muted-foreground">No details yet</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={onEdit}
                aria-label="Edit stop"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={busy}
                onClick={onDelete}
                aria-label="Remove stop"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
