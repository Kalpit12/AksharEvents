"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventActivity, toggleEventActivity } from "@/lib/exhibitor-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Bus, MapPin, Plus } from "lucide-react";
import type { ActivityKind, TravelCategory } from "@prisma/client";

type Activity = {
  id: string;
  kind: ActivityKind;
  travelType: TravelCategory | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  maxSlots: number | null;
  price: string;
  currency: string;
  isActive: boolean;
  _count: { bookings: number };
};

export function OrganizerActivitiesPanel({
  eventId,
  eventTitle,
  activities,
}: {
  eventId: string;
  eventTitle: string;
  activities: Activity[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<ActivityKind>("TOUR");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    formData.set("kind", kind);
    const result = await createEventActivity(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Published for exhibitors");
    (e.target as HTMLFormElement).reset();
    setKind("TOUR");
    router.refresh();
  };

  const handleToggle = async (activityId: string) => {
    const result = await toggleEventActivity(activityId, eventId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Updated");
    router.refresh();
  };

  const tours = activities.filter((a) => a.kind === "TOUR");
  const travel = activities.filter((a) => a.kind === "TRAVEL");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Tours & travel</h2>
        <p className="text-sm text-muted-foreground">
          Create options for {eventTitle}. Exhibitors can book these from their dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add tour or travel option
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex gap-2">
              <Button type="button" variant={kind === "TOUR" ? "default" : "outline"} size="sm" onClick={() => setKind("TOUR")}>
                <MapPin className="h-4 w-4" /> Tour
              </Button>
              <Button type="button" variant={kind === "TRAVEL" ? "default" : "outline"} size="sm" onClick={() => setKind("TRAVEL")}>
                <Bus className="h-4 w-4" /> Travel
              </Button>
            </div>

            {kind === "TRAVEL" && (
              <div className="sm:col-span-2">
                <Label htmlFor="travelType">Travel type</Label>
                <select id="travelType" name="travelType" className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="SHUTTLE">
                  <option value="SHUTTLE">Shuttle</option>
                  <option value="FLIGHT">Flight</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Venue shuttle from airport" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="startAt">Starts</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="endAt">Ends (optional)</Label>
              <Input id="endAt" name="endAt" type="datetime-local" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="location">Location / pickup</Label>
              <Input id="location" name="location" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="maxSlots">Max exhibitor slots</Label>
              <Input id="maxSlots" name="maxSlots" type="number" min={1} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="price">Price (KES)</Label>
              <Input id="price" name="price" type="number" min={0} step="0.01" defaultValue={0} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading}>{loading ? "Publishing…" : "Publish option"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ActivityTable title="Tours" items={tours} onToggle={handleToggle} />
      <ActivityTable title="Travel options" items={travel} onToggle={handleToggle} />
    </div>
  );
}

function ActivityTable({ title, items, onToggle }: { title: string; items: Activity[]; onToggle: (id: string) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((activity) => (
              <li key={activity.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{activity.title}</p>
                    <Badge variant={activity.isActive ? "default" : "outline"}>{activity.isActive ? "Active" : "Hidden"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(activity.startAt, "PPp")} · {activity._count.bookings} bookings
                  </p>
                  {Number(activity.price) > 0 && <p className="text-sm">{formatCurrency(activity.price, activity.currency)}</p>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onToggle(activity.id)}>
                  {activity.isActive ? "Hide" : "Activate"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
