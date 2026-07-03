import { formatDate } from "@/lib/utils";

export function formatEventDateRange(startDate: Date | string, endDate?: Date | string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (end && end.getTime() !== start.getTime()) {
    return `${formatDate(start, "d MMM yyyy")} – ${formatDate(end, "d MMM yyyy")}`;
  }
  return formatDate(start, "EEEE, d MMMM yyyy");
}

export function formatEventTimings(startTime?: string | null, endTime?: string | null) {
  if (!startTime && !endTime) return null;
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime ?? endTime ?? null;
}

export function formatEventVenue(venueName?: string | null, venueCity?: string | null) {
  return [venueName, venueCity].filter(Boolean).join(", ") || null;
}
