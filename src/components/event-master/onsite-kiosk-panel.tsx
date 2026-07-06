"use client";

import { useState } from "react";
import { configureEventBoothKiosk } from "@/lib/booth-kiosk-actions";
import { getBoothKioskUrl } from "@/lib/booth-kiosk-url";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, Copy, IdCard, Link2, MapPin, ScanLine } from "lucide-react";

type Props = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  kiosk: {
    enabled: boolean;
    hasPassword: boolean;
    slug: string;
  };
};

export default function OnsiteKioskPanel({
  eventId,
  eventTitle,
  eventLocation,
  startDate,
  endDate,
  kiosk,
}: Props) {
  const [password, setPassword] = useState("");
  const [isEnabled, setIsEnabled] = useState(kiosk.enabled);
  const [saving, setSaving] = useState(false);

  const link = kiosk.slug ? getBoothKioskUrl(kiosk.slug) : null;
  const dateRange = `${formatDate(startDate, "d MMM yyyy")} – ${formatDate(endDate, "d MMM yyyy")}`;

  const save = async (nextEnabled: boolean) => {
    setSaving(true);
    const res = await configureEventBoothKiosk(eventId, {
      enabled: nextEnabled,
      password: password || undefined,
    });
    setSaving(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    setIsEnabled(res.enabled);
    if (password) setPassword("");
    toast.success(nextEnabled ? "On-site link enabled" : "On-site link disabled");
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("On-site link copied");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">On-site registration for</p>
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
          Share one password-protected link with exhibitor staff to register walk-in visitors and scan
          their passes for event check-in. Visitor check-ins appear in the Check-ins tab.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <IdCard className="h-4 w-4 text-primary" />
            Instant registration
          </div>
          <p className="text-sm text-muted-foreground">
            Staff register unregistered visitors with a live badge preview. The badge is emailed to
            the visitor automatically.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ScanLine className="h-4 w-4 text-primary" />
            Pass check-in
          </div>
          <p className="text-sm text-muted-foreground">
            Scan a visitor&apos;s QR code or enter their booking number to check them into the event.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">On-site link & password</h3>
            <p className="text-xs text-muted-foreground">One link for all staff and exhibitor booths</p>
          </div>
          <Badge variant={isEnabled ? "default" : "outline"}>
            {isEnabled ? "Active" : "Off"}
          </Badge>
        </div>

        <div className="space-y-3">
          <Input
            type="password"
            placeholder={kiosk.hasPassword ? "New password (optional)" : "Set staff password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void save(true)}>
              {isEnabled ? "Update password" : "Enable link"}
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
    </div>
  );
}
