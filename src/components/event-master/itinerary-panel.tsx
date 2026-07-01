"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EventScheduleManager } from "@/components/event-master/event-config-panels";
import { ScheduleFileUpload } from "@/components/event-master/schedule-file-upload";
import TourTravelPlanner from "@/components/event-master/tour-travel-planner";
import type { EventScheduleItemOption } from "@/lib/event-config-types";
import {
  importEventScheduleFromUpload,
  notifyExhibitorsOfEventSchedule,
} from "@/lib/itinerary-actions";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { EventActivityOption } from "@/lib/event-activity-types";
import { aggregateTourTravelExhibitorSelections,
  type TourTravelExhibitorSelection,
} from "@/lib/tour-travel-exhibitor-selection";
import { useUrlEnumState } from "@/hooks/use-dashboard-url-state";
import { Button } from "@/components/ui/Button";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import {
  Bell,
  Bus,
  CalendarDays,
  Users,
} from "lucide-react";

const ITINERARY_SECTION_IDS = ["tours-travel", "event-schedule"] as const;
type ItinerarySection = (typeof ITINERARY_SECTION_IDS)[number];

const ITINERARY_SECTIONS: {
  id: ItinerarySection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "tours-travel", label: "Tours & travel", icon: Bus },
  { id: "event-schedule", label: "Event schedule", icon: CalendarDays },
];

type Props = {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  itineraries: SerializedTourTravelItinerary[];
  scheduleItems: EventScheduleItemOption[];
  exhibitors?: AdminExhibitorRecord[];
  activities?: EventActivityOption[];
};

export default function ItineraryPanel({
  eventId,
  eventStartDate,
  eventEndDate,
  itineraries,
  scheduleItems,
  exhibitors = [],
  activities = [],
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useUrlEnumState(
    "itinerarySection",
    ITINERARY_SECTION_IDS,
    "tours-travel"
  );

  const tourTravelExhibitors = useMemo(
    () => aggregateTourTravelExhibitorSelections(exhibitors, activities),
    [exhibitors, activities]
  );

  const run = async (
    fn: () => Promise<
      { error?: string; success?: boolean; message?: string; silent?: boolean } | void
    >
  ) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result && "error" in result && result.error) {
        notify.error(result.error);
        return;
      }
      if (!(result && "silent" in result && result.silent)) {
        notify.success(
          result && "message" in result && result.message ? result.message : "Saved"
        );
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {ITINERARY_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              section === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {section === "tours-travel" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Exhibitors who selected tours &amp; travel
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Based on registration step &quot;Tours &amp; travel arrangements&quot;. Tour &amp;
              travel notifications are sent only to these exhibitors and their team members.
            </p>
            {tourTravelExhibitors.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No exhibitors have selected tours or travel options yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Company</th>
                      <th className="px-3 py-2.5 font-medium">Contact</th>
                      <th className="px-3 py-2.5 font-medium">Team</th>
                      <th className="px-3 py-2.5 font-medium">Tours</th>
                      <th className="px-3 py-2.5 font-medium">Travel</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tourTravelExhibitors.map((row) => (
                      <TourTravelExhibitorRow key={row.eventExhibitorId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <TourTravelPlanner
            eventId={eventId}
            itineraries={itineraries}
            notifyExhibitorCount={tourTravelExhibitors.length}
          />
        </div>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                Event day schedule
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Build sessions day by day — same format as the public event page (time range, title, speaker).
                Exhibitors see these under Schedules.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await notifyExhibitorsOfEventSchedule(eventId);
                  if (result.error) return { error: result.error };
                  return {
                    message: result.count
                      ? `Notified ${result.count} exhibitor user${result.count === 1 ? "" : "s"}`
                      : "No exhibitor users to notify",
                  };
                })
              }
            >
              <Bell className="h-3.5 w-3.5" />
              Notify exhibitors
            </Button>
          </div>

          <ScheduleFileUpload
            eventId={eventId}
            kind="event-schedule"
            disabled={busy}
            onImport={async (formData) => {
              const result = await importEventScheduleFromUpload(formData);
              if (result.error) {
                notify.error(result.error);
                return { error: result.error };
              }
              notify.success(result.message ?? "Event schedule imported");
              router.refresh();
              return { message: result.message };
            }}
          />

          <EventScheduleManager
            eventId={eventId}
            scheduleItems={scheduleItems}
            eventStartDate={eventStartDate}
            eventEndDate={eventEndDate}
            embedded
          />
        </section>
      )}
    </div>
  );
}

function TourTravelExhibitorRow({ row }: { row: TourTravelExhibitorSelection }) {
  const travelParts = [
    row.shuttles.length > 0 ? `Shuttles: ${row.shuttles.join(", ")}` : null,
    row.accommodationPickup?.toLowerCase().startsWith("yes") ? "Accommodation pickup" : null,
    row.departure && !row.departure.toLowerCase().startsWith("no") ? row.departure : null,
  ].filter(Boolean);

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-2.5 align-top">
        <div className="font-medium">{row.companyName}</div>
        {row.boothNumber ? (
          <div className="text-xs text-muted-foreground">Booth {row.boothNumber}</div>
        ) : null}
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">
        <div>{row.contactName ?? "—"}</div>
        {row.contactEmail ? <div className="text-xs">{row.contactEmail}</div> : null}
      </td>
      <td className="px-3 py-2.5 align-top tabular-nums">{row.memberCount || "—"}</td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">
        {row.tours.length > 0 ? row.tours.join(", ") : "—"}
      </td>
      <td className="px-3 py-2.5 align-top text-muted-foreground">
        {travelParts.length > 0 ? travelParts.join(" · ") : "—"}
      </td>
      <td className="px-3 py-2.5 align-top">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
            row.registrationStatus === "SUBMITTED"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          )}
        >
          {row.registrationStatus === "SUBMITTED" ? "Submitted" : "Draft"}
        </span>
      </td>
    </tr>
  );
}
