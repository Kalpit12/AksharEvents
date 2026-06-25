"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEventHotel,
  createEventRestaurant,
  createEventScheduleItem,
  toggleEventHotel,
  toggleEventRestaurant,
  toggleEventScheduleItem,
} from "@/lib/event-config-actions";
import type {
  EventHotelOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { notify } from "@/lib/notify";
import { cn, formatDate } from "@/lib/utils";
import { Building2, CalendarDays, Clock, ForkKnife, Plus } from "lucide-react";

function ConfigPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ConfigListItem({
  title,
  subtitle,
  isActive,
  onToggle,
}: {
  title: string;
  subtitle?: string | null;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        isActive ? "border-border bg-muted/30" : "border-dashed border-border/70 bg-muted/10 opacity-70"
      )}
    >
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        {subtitle ? <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        {isActive ? "Hide" : "Show"}
      </Button>
    </div>
  );
}

export function EventHotelsManager({
  eventId,
  hotels,
}: {
  eventId: string;
  hotels: EventHotelOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    const result = await createEventHotel(formData);
    setLoading(false);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Hotel added");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  };

  const handleToggle = async (hotelId: string) => {
    const result = await toggleEventHotel(hotelId, eventId);
    if (result.error) {
      notify.error(result.error);
      return;
    }
    notify.success("Updated");
    router.refresh();
  };

  return (
    <ConfigPanel title="Manage hotels for exhibitor registration" icon={Building2}>
      <p className="mb-4 text-xs text-muted-foreground">
        Hotels you add here appear in the exhibitor registration form when team members choose accommodation.
      </p>
      <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="hotel-name">Hotel name</Label>
          <Input id="hotel-name" name="name" required placeholder="e.g. Hotel Serena" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="hotel-location">Location (optional)</Label>
          <Input id="hotel-location" name="location" placeholder="e.g. Nairobi CBD" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="hotel-description">Notes (optional)</Label>
          <Textarea id="hotel-description" name="description" rows={2} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add hotel
          </Button>
        </div>
      </form>
      {hotels.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No hotels added yet.</p>
      ) : (
        <div className="space-y-2">
          {hotels.map((hotel) => (
            <ConfigListItem
              key={hotel.id}
              title={hotel.name}
              subtitle={hotel.location || hotel.description}
              isActive={hotel.isActive}
              onToggle={() => void handleToggle(hotel.id)}
            />
          ))}
        </div>
      )}
    </ConfigPanel>
  );
}

export function EventRestaurantsManager({
  eventId,
  restaurants,
}: {
  eventId: string;
  restaurants: EventRestaurantOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    const result = await createEventRestaurant(formData);
    setLoading(false);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Restaurant added");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  };

  const handleToggle = async (restaurantId: string) => {
    const result = await toggleEventRestaurant(restaurantId, eventId);
    if (result.error) {
      notify.error(result.error);
      return;
    }
    notify.success("Updated");
    router.refresh();
  };

  return (
    <ConfigPanel title="Manage restaurants for exhibitor registration" icon={ForkKnife}>
      <p className="mb-4 text-xs text-muted-foreground">
        Restaurants you add here appear as dining options on the exhibitor food outings step.
      </p>
      <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="restaurant-name">Restaurant name</Label>
          <Input id="restaurant-name" name="name" required placeholder="e.g. Carnivore Veg Garden" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="restaurant-cuisine">Cuisine (optional)</Label>
          <Input id="restaurant-cuisine" name="cuisine" placeholder="e.g. Indian vegetarian" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="restaurant-location">Location (optional)</Label>
          <Input id="restaurant-location" name="location" placeholder="e.g. Westlands" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="restaurant-description">Notes (optional)</Label>
          <Textarea id="restaurant-description" name="description" rows={2} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add restaurant
          </Button>
        </div>
      </form>
      {restaurants.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No restaurants added yet.</p>
      ) : (
        <div className="space-y-2">
          {restaurants.map((restaurant) => (
            <ConfigListItem
              key={restaurant.id}
              title={restaurant.name}
              subtitle={[restaurant.cuisine, restaurant.location].filter(Boolean).join(" · ") || restaurant.description}
              isActive={restaurant.isActive}
              onToggle={() => void handleToggle(restaurant.id)}
            />
          ))}
        </div>
      )}
    </ConfigPanel>
  );
}

export function EventScheduleManager({
  eventId,
  scheduleItems,
}: {
  eventId: string;
  scheduleItems: EventScheduleItemOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    const result = await createEventScheduleItem(formData);
    setLoading(false);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Schedule item added");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  };

  const handleToggle = async (itemId: string) => {
    const result = await toggleEventScheduleItem(itemId, eventId);
    if (result.error) {
      notify.error(result.error);
      return;
    }
    notify.success("Updated");
    router.refresh();
  };

  return (
    <ConfigPanel title="Manage event schedule" icon={CalendarDays}>
      <p className="mb-4 text-xs text-muted-foreground">
        Build the full event schedule here. Exhibitors see these items during registration and on their dashboard.
      </p>
      <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="schedule-title">Title</Label>
          <Input id="schedule-title" name="title" required placeholder="e.g. Opening ceremony" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="schedule-start">Start</Label>
          <Input id="schedule-start" name="startAt" type="datetime-local" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="schedule-end">End (optional)</Label>
          <Input id="schedule-end" name="endAt" type="datetime-local" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="schedule-location">Location (optional)</Label>
          <Input id="schedule-location" name="location" placeholder="e.g. Main hall" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="schedule-description">Description (optional)</Label>
          <Textarea id="schedule-description" name="description" rows={2} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add schedule item
          </Button>
        </div>
      </form>
      {scheduleItems.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No schedule items yet.</p>
      ) : (
        <div className="space-y-2">
          {scheduleItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
                item.isActive ? "border-border bg-muted/30" : "border-dashed border-border/70 bg-muted/10 opacity-70"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  {!item.isActive ? <Badge variant="outline">Hidden</Badge> : null}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.startAt, "EEE · MMM d · h:mm a")}
                  {item.endAt ? ` – ${formatDate(item.endAt, "h:mm a")}` : ""}
                  {item.location ? ` · ${item.location}` : ""}
                </div>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleToggle(item.id)}>
                {item.isActive ? "Hide" : "Show"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </ConfigPanel>
  );
}
