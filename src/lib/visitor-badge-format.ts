import { formatDate } from "@/lib/utils";

/** Same date format as EventVisitorBadge — safe for client components. */
export function formatBadgeDateLabel(startDate: Date | string, endDate?: Date | string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (end && end.getTime() !== start.getTime()) {
    return `${formatDate(start, "d MMM")} – ${formatDate(end, "d MMM yyyy")}`;
  }
  return formatDate(start, "d MMM yyyy");
}
