import { BRAND } from "@/lib/utils";
import { formatBadgeDateLabel } from "@/lib/visitor-badge-format";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { cn } from "@/lib/utils";

export type EventBadgeEventInfo = {
  title: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  venueName?: string | null;
  venueCity?: string | null;
};

export type EventBadgeProps = {
  attendeeName: string;
  attendeeDesignation?: string | null;
  bookingNumber: string;
  qrDataUrl?: string;
  passLabel?: string;
  event: EventBadgeEventInfo;
  preview?: boolean;
  /** Inside ProfileCard preview shell — drops outer shadow/max-width. */
  embedded?: boolean;
};

/** Portrait event badge — GITEX-style lanyard pass with AxarEvents branding. */
export function EventVisitorBadge({
  attendeeName,
  attendeeDesignation,
  bookingNumber,
  qrDataUrl,
  passLabel = "VISITOR",
  event,
  preview = false,
  embedded = false,
}: EventBadgeProps) {
  const location = [event.venueName, event.venueCity].filter(Boolean).join(", ");
  const dateLabel = formatBadgeDateLabel(event.startDate, event.endDate);

  const ribbonColor =
    passLabel === "VIP"
      ? "bg-amber-500 text-espresso"
      : passLabel === "VISITOR"
        ? "bg-champagne text-espresso"
        : "bg-primary text-primary-foreground";

  const displayName = attendeeName.trim() || (preview ? "Your Name" : "—");
  const displayDesignation = attendeeDesignation?.trim() || (preview ? "Your Designation" : null);
  const isPlaceholderName = preview && !attendeeName.trim();
  const isPlaceholderDesignation = preview && !attendeeDesignation?.trim();

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border-2 bg-white ring-1 ring-border",
        !embedded && "mx-auto max-w-[340px] shadow-2xl",
        embedded && "shadow-none",
        preview && !embedded && "border-dashed border-champagne/60 shadow-lg",
        preview && embedded && "border-dashed border-champagne/60",
        !preview && "border-champagne/50 shadow-espresso/15"
      )}
    >
      <div className="flex justify-center bg-espresso py-2">
        <div className="h-3 w-12 rounded-full border-2 border-champagne/40 bg-espresso" aria-hidden />
      </div>

      <div className="bg-gradient-to-r from-espresso via-espresso/95 to-champagne-dark px-5 py-4 text-alabaster">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-champagne text-lg font-bold text-espresso shadow-sm">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight tracking-tight">{BRAND.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-champagne-light/70">
                {BRAND.tagline}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ribbonColor}`}
          >
            {passLabel}
          </span>
        </div>
      </div>

      <div className="border-b border-border bg-muted/30 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Official event badge
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {event.title}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Name
        </p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold uppercase leading-tight tracking-tight",
            isPlaceholderName ? "text-muted-foreground/50" : "text-espresso"
          )}
        >
          {displayName}
        </p>
        {(displayDesignation || preview) && (
          <>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Designation
            </p>
            <p
              className={cn(
                "mt-1 text-base font-semibold",
                isPlaceholderDesignation ? "text-muted-foreground/50" : "text-primary"
              )}
            >
              {displayDesignation}
            </p>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-border bg-gradient-to-b from-alabaster to-muted/20 px-5 pb-5 pt-4">
        <div className="mx-auto flex max-w-[220px] aspect-square items-center justify-center rounded-xl border-2 border-espresso/10 bg-white p-3 shadow-inner">
          {preview || !qrDataUrl ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted/30 text-muted-foreground">
              <QrCode className="h-16 w-16 opacity-40" strokeWidth={1.25} />
              <span className="text-[10px] font-medium uppercase tracking-wider">QR on confirm</span>
            </div>
          ) : (
            <img
              src={qrDataUrl}
              alt="Entry QR code"
              width={200}
              height={200}
              className="mx-auto aspect-square w-full"
            />
          )}
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
          {preview ? "Your unique QR appears after registration" : "Scan at entrance for check-in"}
        </p>
        {!preview && (
          <p className="mt-1 text-center font-mono text-[10px] text-muted-foreground/80">
            {bookingNumber}
          </p>
        )}
      </div>

      <div className="bg-espresso px-4 py-2 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-champagne-light/60">
          Powered by {BRAND.name}
        </p>
      </div>
    </div>
  );
}

/** @deprecated Use EventVisitorBadge */
export function DigitalPassCard({
  attendeeName,
  attendeeDesignation,
  bookingNumber,
  qrDataUrl,
  passLabel,
  event,
  variant: _variant,
  ticketTypeName,
  ticketTier,
}: EventBadgeProps & {
  variant?: "default" | "compact";
  ticketTypeName?: string | null;
  ticketTier?: string | null;
}) {
  const label = passLabel ?? getPassBadgeLabel(ticketTypeName, ticketTier);
  return (
    <EventVisitorBadge
      attendeeName={attendeeName}
      attendeeDesignation={attendeeDesignation}
      bookingNumber={bookingNumber}
      qrDataUrl={qrDataUrl}
      passLabel={label}
      event={event}
    />
  );
}
