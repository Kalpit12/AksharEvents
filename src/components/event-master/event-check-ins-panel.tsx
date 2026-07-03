"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, MapPin, ScanLine, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";
import type { VisitorCheckInStats } from "@/lib/visitor-check-ins";
import type { ExhibitorCheckInStats } from "@/lib/exhibitor-check-ins";
import VisitorCheckInsPanel from "@/components/event-master/visitor-check-ins-panel";
import ExhibitorCheckInsPanel from "@/components/event-master/exhibitor-check-ins-panel";
import type { PublishedEventOption } from "@/components/event-master/visitor-check-ins-panel";

export type CheckInKind = "visitor" | "exhibitor";

type Props = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  publishedEvents?: PublishedEventOption[];
  visitorStats: VisitorCheckInStats;
  exhibitorStats: ExhibitorCheckInStats;
  checkInKind: CheckInKind;
};

const KIND_TABS: { id: CheckInKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "visitor", label: "Visitors", icon: Users },
  { id: "exhibitor", label: "Exhibitors", icon: Store },
];

export default function EventCheckInsPanel({
  eventId,
  eventTitle,
  eventLocation,
  startDate,
  endDate,
  publishedEvents = [],
  visitorStats,
  exhibitorStats,
  checkInKind,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateRange = `${formatDate(startDate, "d MMM yyyy")} – ${formatDate(endDate, "d MMM yyyy")}`;

  const setKind = (kind: CheckInKind) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "checkins");
    params.set("checkinKind", kind);
    params.set("eventId", eventId);
    router.push(`/admin?${params.toString()}`);
  };

  const onEventChange = (nextEventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "checkins");
    params.set("checkinKind", checkInKind);
    params.set("eventId", nextEventId);
    router.push(`/admin?${params.toString()}`);
  };

  const kindLabel = checkInKind === "visitor" ? "Visitor" : "Exhibitor";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {kindLabel} check-ins for
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight sm:text-xl">{eventTitle}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {eventLocation}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {checkInKind === "visitor"
                ? "Visitor registrations and entrance scans for this event."
                : "Exhibitor team badge scans from the hall entrance for this event."}
            </p>
          </div>

          {publishedEvents.length > 1 && (
            <div className="w-full shrink-0 sm:w-72">
              <label htmlFor="checkins-event" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Switch event
              </label>
              <select
                id="checkins-event"
                value={eventId}
                onChange={(e) => onEventChange(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {publishedEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          {KIND_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = checkInKind === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKind(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href={`/admin/scanner?eventId=${eventId}`}>
            <ScanLine className="h-4 w-4" />
            Open scanner
          </Link>
        </Button>
      </div>

      {checkInKind === "visitor" ? (
        <VisitorCheckInsPanel eventTitle={eventTitle} stats={visitorStats} />
      ) : (
        <ExhibitorCheckInsPanel eventTitle={eventTitle} stats={exhibitorStats} />
      )}
    </div>
  );
}
