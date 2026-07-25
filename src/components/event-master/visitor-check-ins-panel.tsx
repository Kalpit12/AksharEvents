"use client";

import { useMemo, useState } from "react";
import type { VisitorCheckInStats } from "@/lib/visitor-check-ins";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, ScanLine, Users } from "lucide-react";
import { CheckInStatusBadge, StatCard } from "@/components/event-master/check-ins-shared";

export type PublishedEventOption = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  lifecycle?: "Live" | "Upcoming" | "Completed";
};

type Props = {
  eventTitle: string;
  stats: VisitorCheckInStats;
};

export default function VisitorCheckInsPanel({ eventTitle, stats }: Props) {
  const [query, setQuery] = useState("");

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

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered" value={stats.totalRegistrations} icon={Users} tone="default" />
        <StatCard label="Checked in" value={stats.checkedIn} icon={CheckCircle2} tone="success" />
        <StatCard label="Not yet arrived" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Check-in rate" value={`${checkInRate}%`} icon={ScanLine} tone="default" />
      </div>

      <Input
        placeholder="Search by name, email, or booking #"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:max-w-md"
      />

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
