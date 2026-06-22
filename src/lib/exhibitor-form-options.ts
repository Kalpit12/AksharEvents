import { formatDate } from "@/lib/utils";
import type { EventActivityOption } from "@/lib/event-activity-types";
import { subDays } from "date-fns";

export function buildSetupDateOptions(startDate: string): string[] {
  const start = new Date(startDate);
  const dayBefore = subDays(start, 1);
  return [
    `${formatDate(dayBefore.toISOString(), "MMM d")} (full day)`,
    `${formatDate(dayBefore.toISOString(), "MMM d")} afternoon only`,
    `${formatDate(start.toISOString(), "MMM d")} morning (limited)`,
  ];
}

export function buildDepartureOptions(endDate: string): string[] {
  const end = formatDate(endDate, "MMM d");
  const next = subDays(new Date(endDate), -1);
  return [
    "No — own arrangements",
    `Yes — ${end} afternoon`,
    `Yes — ${formatDate(next.toISOString(), "MMM d")}`,
  ];
}

export function buildMealOptions(startDate: string, endDate: string): string[] {
  return [
    `Welcome vegetarian dinner (${formatDate(startDate, "MMM d")})`,
    "Daily vegetarian venue lunches",
    `Vegetarian gala dinner (${formatDate(endDate, "MMM d")})`,
    `Vegetarian farewell lunch (${formatDate(endDate, "MMM d")})`,
  ];
}

export const VEG_DINING_EXPERIENCES = [
  "Vegetarian restaurant outing",
  "Rooftop sundowner — veg menu",
  "Vegetarian street food market tour",
  "Coffee farm experience",
  "Private vegetarian team dinner",
] as const;

export function activityToTourOption(activity: EventActivityOption) {
  const price =
    activity.price > 0 ? ` · ${activity.currency} ${activity.price.toLocaleString()}/person` : "";
  const when = formatDate(activity.startAt, "MMM d · h:mm a");
  return {
    id: activity.id,
    title: activity.title,
    sub: `${when}${activity.location ? ` · ${activity.location}` : ""}${price}`,
    badge: activity.price > 0 ? "Paid" : "Included",
    badgeClass: activity.price > 0
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
}

export function activityLabelMap(activities: EventActivityOption[]): Map<string, string> {
  return new Map(activities.map((a) => [a.id, a.title]));
}
