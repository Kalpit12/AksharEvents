import { cn, formatDate } from "@/lib/utils";

export type EventScheduleTimelineItem = {
  id: string;
  title: string;
  speaker?: string | null;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt?: string | null;
  isActive?: boolean;
};

export function formatScheduleTimeRange(startAt: string, endAt?: string | null) {
  const start = formatDate(startAt, "HH:mm");
  if (!endAt) return start;
  return `${start} — ${formatDate(endAt, "HH:mm")}`;
}

export function EventScheduleTimeline({
  items,
  className,
  showHiddenBadge = false,
  actions,
}: {
  items: EventScheduleTimelineItem[];
  className?: string;
  showHiddenBadge?: boolean;
  actions?: (item: EventScheduleTimelineItem) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No schedule items yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-start sm:gap-4",
            item.isActive === false && "border-dashed opacity-70"
          )}
        >
          <div className="shrink-0 text-sm font-mono text-primary sm:w-32">
            {formatScheduleTimeRange(item.startAt, item.endAt)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.title}</p>
              {showHiddenBadge && item.isActive === false ? (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Hidden
                </span>
              ) : null}
            </div>
            {item.speaker ? (
              <p className="text-sm text-muted-foreground">{item.speaker}</p>
            ) : null}
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            {item.location ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.location}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions(item)}</div> : null}
        </div>
      ))}
    </div>
  );
}
