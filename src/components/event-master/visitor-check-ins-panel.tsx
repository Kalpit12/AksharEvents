"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { VisitorCheckInStats } from "@/lib/visitor-check-ins";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock, MapPin, ScanLine, Users } from "lucide-react";

export type PublishedEventOption = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
};

type Props = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  publishedEvents?: PublishedEventOption[];
  stats: VisitorCheckInStats;
};

export default function VisitorCheckInsPanel({
  eventId,
  eventTitle,
  eventLocation,
  startDate,
  endDate,
  publishedEvents = [],
  stats,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const dateRange = `${formatDate(startDate, "d MMM yyyy")} – ${formatDate(endDate, "d MMM yyyy")}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stats.records;
    return stats.records.filter(
      (r) =>
        r.attendeeName.toLowerCase().includes(q) ||
        r.attendeeEmail.toLowerCase().includes(q) ||
        r.attendeeDesignation?.toLowerCase().includes(q) ||
        r.attendeeCompany?.toLowerCase().includes(q) ||
        r.attendeeSector?.toLowerCase().includes(q) ||
        r.bookingNumber.toLowerCase().includes(q)
    );
  }, [query, stats.records]);

  const checkInRate =
    stats.totalRegistrations > 0
      ? Math.round((stats.checkedIn / stats.totalRegistrations) * 100)
      : 0;

  const onEventChange = (nextEventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "checkins");
    params.set("eventId", nextEventId);
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Visitor check-ins for
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
              Registrations and entrance scans below are for this event only.
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered"
          value={stats.totalRegistrations}
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Checked in"
          value={stats.checkedIn}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Not yet arrived"
          value={stats.pending}
          icon={Clock}
          tone="warning"
        />
        <StatCard label="Check-in rate" value={`${checkInRate}%`} icon={ScanLine} tone="default" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name, email, or booking #"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href={`/admin/scanner?eventId=${eventId}`}>
            <ScanLine className="h-4 w-4" />
            Open scanner
          </Link>
        </Button>
      </div>

      {/* Mobile: card list avoids cramped table columns and wrapping headers */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {stats.totalRegistrations === 0
              ? `No visitor registrations for ${eventTitle} yet. Share the event page so attendees can register to visit.`
              : "No matches for your search."}
          </div>
        ) : (
          filtered.map((row) => <VisitorCheckInCard key={row.id} row={row} />)
        )}
      </div>

      {/* Desktop: horizontal scroll table with nowrap cells */}
      <div className="hidden rounded-2xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <p className="sr-only">Swipe horizontally to view all visitor check-in columns.</p>
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="whitespace-nowrap px-4 py-3 font-medium">Visitor</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Designation</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Company</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Sector</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Booking</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Registered</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {stats.totalRegistrations === 0
                      ? `No visitor registrations for ${eventTitle} yet. Share the event page so attendees can register to visit.`
                      : "No matches for your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-medium">{row.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">{row.attendeeEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.attendeeDesignation ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.attendeeCompany ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.attendeeSector ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{row.bookingNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(row.registeredAt, "d MMM yyyy HH:mm")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <CheckInStatusBadge checkedIn={row.checkedIn} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.checkedInAt ? formatDate(row.checkedInAt, "d MMM yyyy HH:mm") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckInStatusBadge({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked in</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

function VisitorCheckInCard({ row }: { row: VisitorCheckInStats["records"][number] }) {
  const fields = [
    { label: "Designation", value: row.attendeeDesignation },
    { label: "Company", value: row.attendeeCompany },
    { label: "Sector", value: row.attendeeSector },
    { label: "Booking", value: row.bookingNumber, mono: true },
    { label: "Registered", value: formatDate(row.registeredAt, "d MMM yyyy HH:mm") },
    {
      label: "Checked in",
      value: row.checkedInAt ? formatDate(row.checkedInAt, "d MMM yyyy HH:mm") : "—",
    },
  ] as const;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{row.attendeeName}</p>
          <p className="truncate text-sm text-muted-foreground">{row.attendeeEmail}</p>
        </div>
        <CheckInStatusBadge checkedIn={row.checkedIn} />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0 rounded-lg bg-muted/40 px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
            </dt>
            <dd
              className={`mt-1 truncate text-sm font-medium text-foreground ${"mono" in field && field.mono ? "font-mono text-xs" : ""}`}
              title={field.value ?? undefined}
            >
              {field.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-border bg-card";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
