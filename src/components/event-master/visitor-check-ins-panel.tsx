"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VisitorCheckInStats } from "@/lib/visitor-check-ins";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, ScanLine, Users } from "lucide-react";

type Props = {
  eventId: string;
  stats: VisitorCheckInStats;
};

export default function VisitorCheckInsPanel({ eventId, stats }: Props) {
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
          className="max-w-md"
        />
        <Button asChild>
          <Link href={`/admin/scanner?eventId=${eventId}`}>
            <ScanLine className="h-4 w-4" />
            Open scanner
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Visitor</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {stats.totalRegistrations === 0
                      ? "No visitor registrations yet. Share the event page so attendees can register to visit."
                      : "No matches for your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">{row.attendeeEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.attendeeDesignation ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.attendeeCompany ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.attendeeSector ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.bookingNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(row.registeredAt, "d MMM yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      {row.checkedIn ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked in</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
