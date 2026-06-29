"use client";

import { useEffect, useState } from "react";
import FlightBookingsPanel from "@/components/event-master/flight-bookings-panel";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import { loadEventMasterFlightsData } from "@/lib/event-master-flights-data";

type Props = {
  eventId: string;
  exhibitors: AdminExhibitorRecord[];
  eventTitle: string;
  defaultAgentEmail?: string;
  defaultCcEmail?: string;
};

export default function FlightBookingsPanelLazy({
  eventId,
  exhibitors,
  eventTitle,
  defaultAgentEmail,
  defaultCcEmail,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<Parameters<typeof FlightBookingsPanel>[0]["requests"]>([]);
  const [memberDocuments, setMemberDocuments] = useState<
    Parameters<typeof FlightBookingsPanel>[0]["memberDocuments"]
  >([]);
  const [memberWorkflows, setMemberWorkflows] = useState<
    NonNullable<Parameters<typeof FlightBookingsPanel>[0]["memberWorkflows"]>
  >([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadEventMasterFlightsData(eventId).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to load flight bookings");
        setLoading(false);
        return;
      }
      setRequests(result.data.airBookingRequests);
      setMemberDocuments(result.data.memberDocuments);
      setMemberWorkflows(result.data.memberWorkflows);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <FlightBookingsPanel
      requests={requests}
      exhibitors={exhibitors}
      memberDocuments={memberDocuments}
      memberWorkflows={memberWorkflows}
      eventTitle={eventTitle}
      defaultAgentEmail={defaultAgentEmail}
      defaultCcEmail={defaultCcEmail}
    />
  );
}
