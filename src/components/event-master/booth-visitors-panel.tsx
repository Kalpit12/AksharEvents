"use client";

import { useMemo, useState } from "react";
import { configureBoothKiosk } from "@/lib/booth-kiosk-actions";
import type { BoothVisitStats } from "@/lib/booth-visits";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Copy,
  Link2,
  MapPin,
  ScanLine,
  Search,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/event-master/check-ins-shared";

type Props = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  stats: BoothVisitStats;
};

function boothKioskUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base || ""}/booth/${token}`;
}

function BoothKioskSettings({
  eventExhibitorId,
  companyName,
  boothNumber,
  enabled,
  token,
  hasPassword,
}: {
  eventExhibitorId: string;
  companyName: string;
  boothNumber: string | null;
  enabled: boolean;
  token: string | null;
  hasPassword: boolean;
}) {
  const [password, setPassword] = useState("");
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [kioskToken, setKioskToken] = useState(token);
  const [saving, setSaving] = useState(false);

  const link = kioskToken ? boothKioskUrl(kioskToken) : null;

  const save = async (nextEnabled: boolean) => {
    setSaving(true);
    const res = await configureBoothKiosk(eventExhibitorId, {
      enabled: nextEnabled,
      password: password || undefined,
    });
    setSaving(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setIsEnabled(res.enabled);
    if (res.token) setKioskToken(res.token);
    if (password) setPassword("");
    toast.success(nextEnabled ? "Booth kiosk enabled" : "Booth kiosk disabled");
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Booth link copied");
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{companyName}</p>
          <p className="text-xs text-muted-foreground">
            {boothNumber ? `Booth ${boothNumber}` : "Booth not assigned"}
          </p>
        </div>
        <Badge variant={isEnabled ? "default" : "outline"}>
          {isEnabled ? "Kiosk on" : "Kiosk off"}
        </Badge>
      </div>

      <div className="mt-3 space-y-3">
        <Input
          type="password"
          placeholder={hasPassword ? "New password (optional)" : "Set booth password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void save(true)}
          >
            {isEnabled ? "Update password" : "Enable kiosk"}
          </Button>
          {isEnabled && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => void save(false)}
            >
              Disable
            </Button>
          )}
          {link && isEnabled && (
            <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </Button>
          )}
        </div>

        {link && isEnabled && (
          <p className="break-all text-xs text-muted-foreground">
            <Link2 className="mr-1 inline h-3 w-3" />
            {link}
          </p>
        )}
      </div>
    </div>
  );
}

function BoothVisitCard({ row }: { row: BoothVisitStats["records"][number] }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{row.attendeeName}</p>
          <p className="truncate text-sm text-muted-foreground">{row.attendeeEmail}</p>
        </div>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Scanned</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: "Exhibitor", value: row.companyName },
          { label: "Booth", value: row.boothNumber ? `Booth ${row.boothNumber}` : "—" },
          { label: "Company", value: row.attendeeCompany },
          { label: "Designation", value: row.attendeeDesignation },
          { label: "Booking", value: row.bookingNumber, mono: true },
          { label: "Scanned", value: formatDate(row.scannedAt, "d MMM yyyy HH:mm") },
        ].map((field) => (
          <div key={field.label} className="min-w-0 rounded-lg bg-muted/40 px-3 py-2.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
            </dt>
            <dd
              className={`mt-1 truncate text-sm font-medium ${"mono" in field && field.mono ? "font-mono text-xs" : ""}`}
            >
              {field.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function BoothVisitorsPanel({
  eventTitle,
  eventLocation,
  startDate,
  endDate,
  stats,
}: Props) {
  const [query, setQuery] = useState("");
  const [exhibitorFilter, setExhibitorFilter] = useState("all");

  const dateRange = `${formatDate(startDate, "d MMM yyyy")} – ${formatDate(endDate, "d MMM yyyy")}`;

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stats.records.filter((row) => {
      if (exhibitorFilter !== "all" && row.eventExhibitorId !== exhibitorFilter) return false;
      if (!q) return true;
      return (
        row.attendeeName.toLowerCase().includes(q) ||
        row.attendeeEmail.toLowerCase().includes(q) ||
        row.attendeeCompany?.toLowerCase().includes(q) ||
        row.companyName.toLowerCase().includes(q) ||
        row.bookingNumber.toLowerCase().includes(q)
      );
    });
  }, [exhibitorFilter, query, stats.records]);

  const activeBooths = stats.exhibitors.filter((e) => e.boothKioskEnabled).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Booth visitors for</p>
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
          Each exhibitor gets a password-protected link to scan visitor event passes at their booth.
          A visitor is counted once per booth and can be scanned at other booths separately.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total booth scans" value={stats.totalVisitors} icon={ScanLine} tone="default" />
        <StatCard label="Exhibitors with kiosk" value={activeBooths} icon={Building2} tone="success" />
        <StatCard label="Participating exhibitors" value={stats.exhibitors.length} icon={Users} tone="default" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold">Booth kiosk links & passwords</h3>
        {stats.exhibitors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exhibitors for this event yet.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {stats.exhibitors.map((exhibitor) => (
              <BoothKioskSettings
                key={exhibitor.eventExhibitorId}
                eventExhibitorId={exhibitor.eventExhibitorId}
                companyName={exhibitor.companyName}
                boothNumber={exhibitor.boothNumber}
                enabled={exhibitor.boothKioskEnabled}
                token={exhibitor.boothKioskToken}
                hasPassword={exhibitor.hasPassword}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search visitors, exhibitors, or booking #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={exhibitorFilter}
          onChange={(e) => setExhibitorFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All exhibitors</option>
          {stats.exhibitors.map((exhibitor) => (
            <option key={exhibitor.eventExhibitorId} value={exhibitor.eventExhibitorId}>
              {exhibitor.companyName}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden rounded-2xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Visitor</th>
                <th className="px-4 py-3 font-medium">Exhibitor</th>
                <th className="px-4 py-3 font-medium">Booth</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {stats.totalVisitors === 0
                      ? "No booth visitors scanned yet. Enable a kiosk link and share it with exhibitors."
                      : "No matches for your search."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">{row.attendeeEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.companyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.boothNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.attendeeCompany ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.bookingNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(row.scannedAt, "d MMM yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {stats.totalVisitors === 0
              ? "No booth visitors scanned yet."
              : "No matches for your search."}
          </div>
        ) : (
          filteredRecords.map((row) => <BoothVisitCard key={row.id} row={row} />)
        )}
      </div>

      {stats.exhibitors.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Visitors per booth</h3>
          <div className="space-y-2">
            {stats.exhibitors
              .filter((e) => e.visitorCount > 0)
              .sort((a, b) => b.visitorCount - a.visitorCount)
              .map((exhibitor) => (
                <div
                  key={exhibitor.eventExhibitorId}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span>
                    {exhibitor.companyName}
                    {exhibitor.boothNumber ? ` · Booth ${exhibitor.boothNumber}` : ""}
                  </span>
                  <span className="font-semibold tabular-nums">{exhibitor.visitorCount}</span>
                </div>
              ))}
            {stats.exhibitors.every((e) => e.visitorCount === 0) && (
              <p className="text-sm text-muted-foreground">No scans recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
