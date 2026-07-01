"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEventHotel,
  createEventItemMaster,
  createEventRestaurant,
  createEventScheduleItem,
  deleteEventItemMaster,
  deleteEventScheduleItem,
  updateEventItemMaster,
  toggleEventHotel,
  toggleEventRestaurant,
  toggleEventScheduleItem,
} from "@/lib/event-config-actions";
import type {
  EventHotelOption,
  EventItemMasterOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";
import { EventScheduleTimeline } from "@/components/events/event-schedule-timeline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import {
  CustomSelect,
  fromAllValue,
  toAllValue,
} from "@/components/exhibitor-portal/custom-select";
import { useUrlStringState } from "@/hooks/use-dashboard-url-state";
import { notify } from "@/lib/notify";
import {
  getScheduleDayKey,
  listEventCalendarDays,
} from "@/lib/event-master-aggregations";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  CalendarDays,
  Clock,
  ForkKnife,
  ListOrdered,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

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
  eventStartDate,
  eventEndDate,
  embedded = false,
}: {
  eventId: string;
  scheduleItems: EventScheduleItemOption[];
  eventStartDate: string;
  eventEndDate: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const eventDays = useMemo(
    () => listEventCalendarDays(eventStartDate, eventEndDate),
    [eventStartDate, eventEndDate]
  );

  const [selectedDayDate, setSelectedDayDate] = useState(eventDays[0]?.date ?? "");

  const activeDay = eventDays.find((day) => day.date === selectedDayDate) ?? eventDays[0];

  const itemsByDay = useMemo(() => {
    const map = new Map<string, EventScheduleItemOption[]>();
    for (const day of eventDays) {
      map.set(day.date, []);
    }
    for (const item of scheduleItems) {
      const key = getScheduleDayKey(item.startAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    for (const items of map.values()) {
      items.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }
    return map;
  }, [eventDays, scheduleItems]);

  const dayItems = activeDay ? itemsByDay.get(activeDay.date) ?? [] : [];

  const buildDateTime = (day: string, time: string) => {
    const normalized = time.length === 5 ? `${time}:00` : time;
    return `${day}T${normalized}`;
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeDay) {
      notify.error("Event dates are required to add schedule items");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    formData.set("startAt", buildDateTime(activeDay.date, String(formData.get("startTime") ?? "")));

    const endTime = String(formData.get("endTime") ?? "").trim();
    if (!endTime) {
      notify.error("End time is required");
      setLoading(false);
      return;
    }
    formData.set("endAt", buildDateTime(activeDay.date, endTime));

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

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    const result = await deleteEventScheduleItem(itemId, eventId);
    setDeletingId(null);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Schedule item removed");
    router.refresh();
  };

  const content = (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        {embedded
          ? "Matches the public event page schedule (08:00 — 09:00 · session title · speaker). Pick a day, add sessions, then notify exhibitors."
          : `Build the schedule day by day across ${eventDays.length} event day${eventDays.length === 1 ? "" : "s"} — same format as the public event page.`}
      </p>

      {eventDays.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {eventDays.map((day) => {
            const count = itemsByDay.get(day.date)?.length ?? 0;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDayDate(day.date)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  activeDay?.date === day.date
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="font-medium">{day.label}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Set the event start and end dates to schedule items day by day.
        </p>
      )}

      {activeDay ? (
        <>
          <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="scheduleDay" value={activeDay.date} />
            <div className="sm:col-span-2">
              <Label htmlFor="schedule-title">Session title</Label>
              <Input
                id="schedule-title"
                name="title"
                required
                placeholder="e.g. Registration & Networking"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="schedule-start">Start time</Label>
              <Input id="schedule-start" name="startTime" type="time" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="schedule-end">End time</Label>
              <Input id="schedule-end" name="endTime" type="time" required className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="schedule-speaker">Speaker / host (optional)</Label>
              <Input
                id="schedule-speaker"
                name="speaker"
                placeholder="e.g. Dr. James Ochieng"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="schedule-location">Location (optional)</Label>
              <Input
                id="schedule-location"
                name="location"
                placeholder="e.g. Main hall"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="schedule-description">Notes (optional)</Label>
              <Textarea
                id="schedule-description"
                name="description"
                rows={2}
                placeholder="Extra details shown below the session title"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add session to {activeDay.shortLabel}
              </Button>
            </div>
          </form>

          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {activeDay.label} schedule
          </div>

          <EventScheduleTimeline
            items={dayItems}
            showHiddenBadge
            actions={(item) => (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === item.id}
                  onClick={() => void handleToggle(item.id)}
                >
                  {item.isActive ? "Hide" : "Show"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === item.id ? "Removing…" : "Remove"}
                </Button>
              </>
            )}
          />
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="mt-5">{content}</div>;
  }

  return (
    <ConfigPanel title="Manage event schedule" icon={CalendarDays}>
      {content}
    </ConfigPanel>
  );
}

const ITEM_CATEGORIES = [
  "Booth",
  "Equipment",
  "Tables, Chairs & Cabinets",
  "Flowers & Plant",
  "Brandings",
  "Consumables",
  "Stationery",
  "Catering",
  "Merchandise",
  "Services",
  "Other",
];

const UNIT_OF_MEASURE_OPTIONS = [
  "each",
  "box",
  "pack",
  "bottle",
  "kg",
  "litre",
  "set",
  "roll",
];

const CURRENCY_OPTIONS = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"];

export function ItemMasterManager({
  eventId,
  items,
}: {
  eventId: string;
  items: EventItemMasterOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<EventItemMasterOption | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editUnitOfMeasure, setEditUnitOfMeasure] = useState("");
  const [editCurrency, setEditCurrency] = useState("KES");
  const [savingEdit, setSavingEdit] = useState(false);
  const [categoryFilter, setCategoryFilter] = useUrlStringState("category", "");
  const [newCategory, setNewCategory] = useState("");
  const [newUnitOfMeasure, setNewUnitOfMeasure] = useState("");
  const [newCurrency, setNewCurrency] = useState("KES");

  const categoryOptions = useMemo(() => {
    const fromItems = items.map((item) => item.category);
    return [...new Set([...ITEM_CATEGORIES, ...fromItems])].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!categoryFilter) return items;
    return items.filter((item) => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory) {
      notify.error("Select a category");
      return;
    }
    if (!newUnitOfMeasure) {
      notify.error("Select a unit of measure");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("eventId", eventId);
    formData.set("category", newCategory);
    formData.set("unitOfMeasure", newUnitOfMeasure);
    formData.set("currency", newCurrency);
    const result = await createEventItemMaster(formData);
    setLoading(false);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Item added");
    (e.target as HTMLFormElement).reset();
    setNewCategory("");
    setNewUnitOfMeasure("");
    setNewCurrency("KES");
    router.refresh();
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    const result = await deleteEventItemMaster(itemId, eventId);
    setDeletingId(null);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    if (editingItem?.id === itemId) setEditingItem(null);
    notify.success("Item removed");
    router.refresh();
  };

  const startEdit = (item: EventItemMasterOption) => {
    setEditingItem(item);
    setEditCategory(item.category);
    setEditUnitOfMeasure(item.unitOfMeasure);
    setEditCurrency(item.currency);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditCategory("");
    setEditUnitOfMeasure("");
    setEditCurrency("KES");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editCategory) {
      notify.error("Select a category");
      return;
    }
    if (!editUnitOfMeasure) {
      notify.error("Select a unit of measure");
      return;
    }

    setSavingEdit(true);
    const formData = new FormData(e.currentTarget);
    formData.set("itemId", editingItem.id);
    formData.set("eventId", eventId);
    formData.set("category", editCategory);
    formData.set("unitOfMeasure", editUnitOfMeasure);
    formData.set("currency", editCurrency);
    const result = await updateEventItemMaster(formData);
    setSavingEdit(false);

    if (result.error) {
      notify.error(result.error);
      return;
    }

    notify.success("Item updated");
    cancelEdit();
    router.refresh();
  };

  return (
    <ConfigPanel title="Item master" icon={ListOrdered}>
      <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="item-name">Item name</Label>
          <Input id="item-name" name="name" required placeholder="e.g. Water bottle (500ml)" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="item-category">Category</Label>
          <CustomSelect
            id="item-category"
            value={newCategory}
            onChange={setNewCategory}
            placeholder="Select category"
            className="mt-1.5"
            options={ITEM_CATEGORIES.map((category) => ({ value: category, label: category }))}
          />
        </div>
        <div>
          <Label htmlFor="item-uom">Unit of measure</Label>
          <CustomSelect
            id="item-uom"
            value={newUnitOfMeasure}
            onChange={setNewUnitOfMeasure}
            placeholder="Select unit"
            className="mt-1.5"
            options={UNIT_OF_MEASURE_OPTIONS.map((uom) => ({ value: uom, label: uom }))}
          />
        </div>
        <div>
          <Label htmlFor="item-unit-cost">Unit cost</Label>
          <Input
            id="item-unit-cost"
            name="unitCost"
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="0.00"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="item-currency">Currency</Label>
          <CustomSelect
            id="item-currency"
            value={newCurrency}
            onChange={setNewCurrency}
            className="mt-1.5"
            options={CURRENCY_OPTIONS.map((currency) => ({ value: currency, label: currency }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </form>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No items in the master list yet.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="w-full min-w-[200px] max-w-xs">
              <Label htmlFor="item-category-filter">Category</Label>
              <CustomSelect
                id="item-category-filter"
                value={toAllValue(categoryFilter)}
                onChange={(value) => setCategoryFilter(fromAllValue(value))}
                className="mt-1.5"
                options={[
                  { value: "__all__", label: `All categories (${items.length})` },
                  ...categoryOptions.map((category) => ({
                    value: category,
                    label: `${category} (${categoryCounts.get(category) ?? 0})`,
                  })),
                ]}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {filteredItems.length} of {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No items in this category. Choose another category or add a new item.
            </p>
          ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-medium text-muted-foreground">
                <th className="px-3 py-2">Item name</th>
                <th className="whitespace-nowrap px-3 py-2">Category</th>
                <th className="whitespace-nowrap px-3 py-2">Unit of measure</th>
                <th className="whitespace-nowrap px-3 py-2">Unit cost</th>
                <th className="whitespace-nowrap px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) =>
                editingItem?.id === item.id ? (
                  <tr key={item.id} className="border-b border-border bg-muted/30">
                    <td colSpan={5} className="px-3 py-3">
                      <form onSubmit={(e) => void handleUpdate(e)} className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label htmlFor={`edit-item-name-${item.id}`}>Item name</Label>
                          <Input
                            id={`edit-item-name-${item.id}`}
                            name="name"
                            required
                            defaultValue={item.name}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-item-category-${item.id}`}>Category</Label>
                          <CustomSelect
                            id={`edit-item-category-${item.id}`}
                            value={editCategory}
                            onChange={setEditCategory}
                            placeholder="Select category"
                            className="mt-1.5"
                            options={categoryOptions.map((category) => ({
                              value: category,
                              label: category,
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-item-uom-${item.id}`}>Unit of measure</Label>
                          <CustomSelect
                            id={`edit-item-uom-${item.id}`}
                            value={editUnitOfMeasure}
                            onChange={setEditUnitOfMeasure}
                            placeholder="Select unit"
                            className="mt-1.5"
                            options={UNIT_OF_MEASURE_OPTIONS.map((uom) => ({ value: uom, label: uom }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-item-unit-cost-${item.id}`}>Unit cost</Label>
                          <Input
                            id={`edit-item-unit-cost-${item.id}`}
                            name="unitCost"
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            defaultValue={item.unitCost}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-item-currency-${item.id}`}>Currency</Label>
                          <CustomSelect
                            id={`edit-item-currency-${item.id}`}
                            value={editCurrency}
                            onChange={setEditCurrency}
                            className="mt-1.5"
                            options={CURRENCY_OPTIONS.map((currency) => ({
                              value: currency,
                              label: currency,
                            }))}
                          />
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={savingEdit} className="gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            {savingEdit ? "Saving…" : "Save changes"}
                          </Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="max-w-[280px] px-3 py-2.5 font-medium">{item.name}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <Badge variant="outline" className="whitespace-nowrap font-normal">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {item.unitOfMeasure}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {formatCurrency(item.unitCost, item.currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={deletingId === item.id || editingItem !== null}
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          disabled={deletingId === item.id || editingItem !== null}
                          onClick={() => void handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}
    </ConfigPanel>
  );
}
