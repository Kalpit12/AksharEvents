"use client";

import { useMemo, useState } from "react";
import type { ExhibitorBoothVisitRecord } from "@/lib/booth-visits";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Copy, Link2, ScanLine, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";

type Props = {
  visitorCount: number;
  records: ExhibitorBoothVisitRecord[];
  boothKioskEnabled: boolean;
  boothKioskToken: string | null;
};

function boothKioskUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base || ""}/booth/${token}`;
}

export function ExhibitorBoothVisitorsPanel({
  visitorCount,
  records,
  boothKioskEnabled,
  boothKioskToken,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (row) =>
        row.attendeeName.toLowerCase().includes(q) ||
        row.attendeeEmail.toLowerCase().includes(q) ||
        row.attendeeCompany?.toLowerCase().includes(q) ||
        row.bookingNumber.toLowerCase().includes(q)
    );
  }, [query, records]);

  const link = boothKioskToken ? boothKioskUrl(boothKioskToken) : null;

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Booth scan link copied");
  };

  return (
    <div className="space-y-4">
      <Panel title="Booth visitor scanner" icon={ScanLine}>
        {boothKioskEnabled && link ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Open this link on a phone or tablet at your booth. Enter the password from the event
              organizer, then scan each visitor&apos;s event pass once.
            </p>
            <p className="break-all rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Link2 className="mr-1 inline h-3 w-3" />
              {link}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
              <Copy className="h-4 w-4" />
              Copy booth link
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your booth visitor scanner is not enabled yet. Ask the event organizer to enable your
            kiosk link and share the booth password with you.
          </p>
        )}
      </Panel>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Visitors at your booth</h3>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            {visitorCount} total
          </Badge>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or booking #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {visitorCount === 0
              ? "No visitors scanned at your booth yet."
              : "No matches for your search."}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.attendeeName}</p>
                    <p className="truncate text-sm text-muted-foreground">{row.attendeeEmail}</p>
                  </div>
                  <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100">
                    Scanned
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Company</dt>
                    <dd>{row.attendeeCompany ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Designation</dt>
                    <dd>{row.attendeeDesignation ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Booking</dt>
                    <dd className="font-mono text-xs">{row.bookingNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Scanned</dt>
                    <dd>{formatDate(row.scannedAt, "d MMM yyyy HH:mm")}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
