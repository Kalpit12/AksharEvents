import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import { activityLabelMap } from "@/lib/exhibitor-form-options";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { formatDate } from "@/lib/utils";
import { addDays, differenceInCalendarDays } from "date-fns";

export type AggregatedMember = {
  id: string;
  fn: string;
  ln: string;
  role: string;
  food: string;
  transport: string;
  hotel: string;
  company: string;
};

export type TransportItem = {
  company: string;
  title: string;
  sub: string;
};

export type HotelAssignment = {
  name: string;
  hotel: string;
  company: string;
};

export type MealAggregate = {
  meal: string;
  attendees: number;
  companies: string[];
};

export function expoDaysFromRange(startDate: string, endDate: string): number {
  return Math.max(1, differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1);
}

export type EventCalendarDay = {
  index: number;
  date: string;
  label: string;
  shortLabel: string;
};

export function listEventCalendarDays(startDate: string, endDate: string): EventCalendarDay[] {
  const start = new Date(startDate);
  const dayCount = expoDaysFromRange(startDate, endDate);

  return Array.from({ length: dayCount }, (_, offset) => {
    const day = addDays(start, offset);
    return {
      index: offset + 1,
      date: formatDate(day, "yyyy-MM-dd"),
      label: `Day ${offset + 1} · ${formatDate(day, "EEE · MMM d")}`,
      shortLabel: formatDate(day, "EEE · MMM d"),
    };
  });
}

export function getScheduleDayKey(isoDate: string) {
  return formatDate(isoDate, "yyyy-MM-dd");
}

export function aggregateMembers(exhibitors: AdminExhibitorRecord[]): AggregatedMember[] {
  return exhibitors.flatMap((record) =>
    (record.formData?.members ?? []).map((m) => ({
      id: `${record.id}-${m.id}`,
      fn: m.fn,
      ln: m.ln,
      role: m.role,
      food: m.diet || "Not specified",
      transport: m.transport || "—",
      hotel: m.hotel || "—",
      company: record.companyName,
    }))
  );
}

export function aggregateTransport(
  exhibitors: AdminExhibitorRecord[],
  activities: EventActivityOption[],
  itineraries: Pick<SerializedTourTravelItinerary, "id" | "title">[] = []
): TransportItem[] {
  const labels = activityLabelMap(activities);
  for (const trip of itineraries) {
    labels.set(trip.id, trip.title);
  }
  const items: TransportItem[] = [];

  for (const record of exhibitors) {
    const data = record.formData;
    if (!data) continue;

    if (data.form.accommodationPickup?.toLowerCase().startsWith("yes")) {
      items.push({
        company: record.companyName,
        title: "Accommodation pickup",
        sub: data.form.accommodationPickup,
      });
    }

    for (const shuttle of data.shuttles) {
      items.push({
        company: record.companyName,
        title: shuttle,
        sub: "Vehicle will be provided based on availability",
      });
    }

    if (data.travel.dailyVenueTransport === "yes") {
      items.push({
        company: record.companyName,
        title: "Daily venue transport",
        sub: "Requested",
      });
    }

    if (data.travel.airportHotelTransfer === "yes") {
      items.push({
        company: record.companyName,
        title: "Airport ↔ hotel transfer",
        sub: [data.travel.flightNumber, data.travel.arrivalTime]
          .filter(Boolean)
          .join(" · ") || "Details pending",
      });
    }

    if (data.form.depart && !data.form.depart.toLowerCase().startsWith("no")) {
      items.push({
        company: record.companyName,
        title: "Departure drop-off",
        sub: data.form.depart,
      });
    }

    const memberTourIds = data.members.flatMap((m) => m.tourLogistics?.selectedTourIds ?? []);
    const tourIds = [...new Set([...data.selectedTours, ...memberTourIds])];
    for (const tourId of tourIds) {
      items.push({
        company: record.companyName,
        title: labels.get(tourId) ?? tourId,
        sub: "Vehicle will be provided based on availability",
      });
    }
  }

  return items;
}

export function aggregateHotelRequests(exhibitors: AdminExhibitorRecord[]): { company: string; detail: string }[] {
  return exhibitors
    .filter((e) => e.formData?.travel.hotel === "yes")
    .map((e) => ({
      company: e.companyName,
      detail: e.formData!.travel.airportHotelTransfer === "yes"
        ? "Hotel + airport transfer requested"
        : "Hotel accommodation requested",
    }));
}

export function aggregateHotelAssignments(exhibitors: AdminExhibitorRecord[]): HotelAssignment[] {
  return aggregateMembers(exhibitors)
    .filter((m) => m.hotel && m.hotel !== "—" && !m.hotel.toLowerCase().includes("own"))
    .map((m) => ({
      name: `${m.fn} ${m.ln}`,
      hotel: m.hotel,
      company: m.company,
    }));
}

export function aggregateMeals(exhibitors: AdminExhibitorRecord[]): MealAggregate[] {
  const map = new Map<string, { attendees: number; companies: Set<string> }>();

  for (const record of exhibitors) {
    const data = record.formData;
    if (!data) continue;
    const teamSize = Math.max(1, data.members.length || Number(data.form.staff) || 0);

    for (const meal of data.selectedMeals) {
      const entry = map.get(meal) ?? { attendees: 0, companies: new Set<string>() };
      entry.attendees += teamSize;
      entry.companies.add(record.companyName);
      map.set(meal, entry);
    }
  }

  return [...map.entries()].map(([meal, { attendees, companies }]) => ({
    meal,
    attendees,
    companies: [...companies],
  }));
}

export function aggregateDietary(exhibitors: AdminExhibitorRecord[]): { preference: string; count: number; members: string }[] {
  const map = new Map<string, string[]>();

  for (const m of aggregateMembers(exhibitors)) {
    const pref = m.food || "Not specified";
    if (!map.has(pref)) map.set(pref, []);
    map.get(pref)!.push(m.fn);
  }

  return [...map.entries()].map(([preference, names]) => ({
    preference,
    count: names.length,
    members: names.join(", "),
  }));
}

export function groupActivitiesByDay(activities: EventActivityOption[]) {
  const groups = new Map<string, EventActivityOption[]>();

  for (const activity of activities) {
    const day = formatDate(activity.startAt, "EEE · MMM d");
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(activity);
  }

  return [...groups.entries()].map(([day, items]) => ({ day, items }));
}

export function groupScheduleByDay<T extends { startAt: string }>(items: T[]) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const day = formatDate(item.startAt, "EEE · MMM d");
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(item);
  }

  return [...groups.entries()].map(([day, dayItems]) => ({ day, items: dayItems }));
}

export function aggregateRestaurantSelections(
  exhibitors: AdminExhibitorRecord[]
): { restaurant: string; companies: string[] }[] {
  const map = new Map<string, Set<string>>();

  for (const record of exhibitors) {
    const data = record.formData;
    if (!data) continue;
    for (const name of data.selectedFoodExp) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name)!.add(record.companyName);
    }
  }

  return [...map.entries()].map(([restaurant, companies]) => ({
    restaurant,
    companies: [...companies],
  }));
}

export function countHotelRequests(exhibitors: AdminExhibitorRecord[]): number {
  return aggregateHotelRequests(exhibitors).length;
}

export function countTransportRequests(exhibitors: AdminExhibitorRecord[]): number {
  return aggregateTransport(exhibitors, []).length;
}
