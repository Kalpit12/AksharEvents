"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminEvent, setAdminEventStatus } from "@/lib/admin-events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { EVENT_FORMATS } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type CategoryOption = { id: string; name: string };
type VenueOption = { id: string; name: string; city: string };
type EventRow = {
  id: string;
  title: string;
  slug: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  city: string | null;
};

export default function AdminEventsPanel({
  categories,
  venues,
  events,
}: {
  categories: CategoryOption[];
  venues: VenueOption[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await createAdminEvent(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Event created");
    e.currentTarget.reset();
    router.refresh();
  };

  const togglePublish = async (eventId: string, publish: boolean) => {
    const result = await setAdminEventStatus(eventId, publish ? "PUBLISHED" : "DRAFT");
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(publish ? "Event published" : "Event unpublished");
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section id="create-event" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Create event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Published expos and events appear in the exhibitor signup form.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="title">Event title *</Label>
            <Input id="title" name="title" required className="mt-1.5" placeholder="Kenya Career Expo 2026" />
          </div>
          <div>
            <Label htmlFor="format">Format *</Label>
            <select
              id="format"
              name="format"
              required
              defaultValue="EXPO"
              className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              {EVENT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" required rows={4} className="mt-1.5" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <select id="categoryId" name="categoryId" required className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="venueId">Venue</Label>
              <select id="venueId" name="venueId" className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                <option value="">No venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} · {v.city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start date *</Label>
              <Input id="startDate" name="startDate" type="date" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="endDate">End date *</Label>
              <Input id="endDate" name="endDate" type="date" required className="mt-1.5" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue="09:00" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue="17:00" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" name="capacity" type="number" min={1} className="mt-1.5" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="publish" value="true" disabled={loading}>
              {loading ? "Creating…" : "Create & publish"}
            </Button>
            <Button type="submit" name="publish" value="false" variant="outline" disabled={loading}>
              Save as draft
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Exhibitors can only register for published events that have not ended.
        </p>

        {events.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No events yet. Create your first event to open exhibitor registration.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(event.startDate, "MMM d, yyyy")} – {formatDate(event.endDate, "MMM d, yyyy")}
                      {event.city ? ` · ${event.city}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.format.replace(/_/g, " ")} · {event.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {event.status === "PUBLISHED" ? (
                      <Button size="sm" variant="outline" onClick={() => togglePublish(event.id, false)}>
                        Unpublish
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => togglePublish(event.id, true)}>
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
