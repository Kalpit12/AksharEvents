"use client";

import { useMemo, useState } from "react";
import type { ExhibitorCheckInStats } from "@/lib/exhibitor-check-ins";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { CheckInStatusBadge, StatCard } from "@/components/event-master/check-ins-shared";

type Props = {
  eventTitle: string;
  stats: ExhibitorCheckInStats;
};

export default function ExhibitorCheckInsPanel({ eventTitle, stats }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stats.records;
    return stats.records.filter(
      (row) =>
        row.memberName.toLowerCase().includes(q) ||
        row.memberEmail.toLowerCase().includes(q) ||
        row.memberRole.toLowerCase().includes(q) ||
        row.companyName.toLowerCase().includes(q) ||
        row.boothLabel?.toLowerCase().includes(q) ||
        row.badgeCode.toLowerCase().includes(q)
    );
  }, [query, stats.records]);

  const checkInRate =
    stats.totalRegistrations > 0
      ? Math.round((stats.checkedIn / stats.totalRegistrations) * 100)
      : 0;

  const withPhoto = stats.records.filter((row) => row.hasBadgePhoto).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team on badges" value={stats.totalRegistrations} tone="default" />
        <StatCard label="Checked in" value={stats.checkedIn} tone="success" />
        <StatCard label="Not yet arrived" value={stats.pending} tone="warning" />
        <StatCard label="Check-in rate" value={`${checkInRate}%`} tone="default" />
      </div>

      <p className="text-xs text-muted-foreground">
        {withPhoto} of {stats.totalRegistrations} team members have a badge photo uploaded.
      </p>

      <Input
        placeholder="Search by name, email, company, booth, or badge ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:max-w-md"
      />

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {stats.totalRegistrations === 0
              ? `No exhibitor team members for ${eventTitle} yet.`
              : "No matches for your search."}
          </div>
        ) : (
          filtered.map((row) => <ExhibitorCheckInCard key={row.id} row={row} />)
        )}
      </div>

      <div className="hidden rounded-2xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="whitespace-nowrap px-4 py-3 font-medium">Exhibitor</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Role</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Company</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Booth</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Badge ID</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Photo</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {stats.totalRegistrations === 0
                      ? `No exhibitor team members for ${eventTitle} yet.`
                      : "No matches for your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-medium">{row.memberName}</p>
                      <p className="text-xs text-muted-foreground">{row.memberEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.memberRole}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.companyName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.boothLabel ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{row.badgeCode}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.hasBadgePhoto ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready</Badge>
                      ) : (
                        <Badge variant="outline">Missing</Badge>
                      )}
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

function ExhibitorCheckInCard({ row }: { row: ExhibitorCheckInStats["records"][number] }) {
  const fields = [
    { label: "Role", value: row.memberRole },
    { label: "Company", value: row.companyName },
    { label: "Booth", value: row.boothLabel },
    { label: "Badge ID", value: row.badgeCode, mono: true },
    {
      label: "Photo",
      value: row.hasBadgePhoto ? "Ready" : "Missing",
    },
    {
      label: "Checked in",
      value: row.checkedInAt ? formatDate(row.checkedInAt, "d MMM yyyy HH:mm") : "—",
    },
  ] as const;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{row.memberName}</p>
          <p className="truncate text-sm text-muted-foreground">{row.memberEmail}</p>
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
