"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  LayoutDashboard,
  Mail,
  MapPin,
  PlusCircle,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  createManualPartnerExhibitor,
  confirmPartnerExhibitorPaymentManually,
  createPartnerOrganizerEvent,
  sendPartnerExhibitorPaymentConfirmation,
} from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { cn, EVENT_FORMATS, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

type PartnerEvent = {
  id: string;
  title: string;
  slug?: string;
  startDate?: Date | string;
};

type CategoryOption = { id: string; name: string };
type VenueOption = { id: string; name: string; city: string };

type ExhibitorRow = {
  id: string;
  boothNumber: string | null;
  event: { id: string; title: string; slug: string };
  exhibitor: {
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    user: { email: string } | null;
  };
  eventBooth: {
    code: string;
    paymentVerified: boolean;
    paymentVerifiedAt: Date | null;
  } | null;
};

type BoothOption = {
  code: string;
  status: string;
  companyName: string | null;
};

type TabId = "add" | "list" | "events";

/** Formats that support exhibitor booth assignment (keep in sync with EXHIBITOR_EVENT_FORMATS). */
const PARTNER_CREATABLE_FORMAT_VALUES = [
  "EXPO",
  "CONFERENCE",
  "JOB_FAIR",
  "CAREER_EVENT",
  "UNIVERSITY_EVENT",
  "TECHNOLOGY",
  "HEALTHCARE",
  "OTHER",
] as const;

const PARTNER_EVENT_FORMATS = EVENT_FORMATS.filter((format) =>
  (PARTNER_CREATABLE_FORMAT_VALUES as readonly string[]).includes(format.value)
);

function boothStatusLabel(booth: BoothOption) {
  if (booth.status === "AVAILABLE" || booth.status === "PREMIUM") return "Available";
  if (booth.status === "OCCUPIED") {
    return booth.companyName ? `Occupied · ${booth.companyName}` : "Occupied";
  }
  return booth.companyName ? `Reserved · ${booth.companyName}` : "Reserved";
}

function isBoothSelectable(booth: BoothOption) {
  return booth.status === "AVAILABLE" || booth.status === "PREMIUM";
}

function compareBoothCodes(a: string, b: string) {
  const matchA = a.match(/^([A-Za-z]+)(\d+)$/);
  const matchB = b.match(/^([A-Za-z]+)(\d+)$/);
  if (matchA && matchB) {
    const letterCompare = matchA[1].localeCompare(matchB[1], undefined, {
      sensitivity: "base",
    });
    if (letterCompare !== 0) return letterCompare;
    return Number(matchA[2]) - Number(matchB[2]);
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "success";
}) {
  const toneStyles = {
    default: "bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
  };

  return (
    <Card className="overflow-hidden border-[color-mix(in_oklab,var(--partner-primary)_18%,transparent)] shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            toneStyles[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BoothCodeCombobox({ boothOptions }: { boothOptions: BoothOption[] }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedOptions = useMemo(
    () => [...boothOptions].sort((a, b) => compareBoothCodes(a.code, b.code)),
    [boothOptions]
  );

  const filteredOptions = useMemo(() => {
    const q = value.trim().toUpperCase();
    if (!q) return sortedOptions;
    return sortedOptions.filter((booth) => {
      const label = boothStatusLabel(booth).toUpperCase();
      return booth.code.includes(q) || label.includes(q);
    });
  }, [sortedOptions, value]);

  const matchedBooth = useMemo(() => {
    const code = value.trim().toUpperCase();
    if (!code) return null;
    return sortedOptions.find((booth) => booth.code === code) ?? null;
  }, [sortedOptions, value]);

  const isUnavailable = matchedBooth !== null && !isBoothSelectable(matchedBooth);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (isUnavailable) {
      input.setCustomValidity(
        "This booth is reserved or occupied. Choose an available booth."
      );
    } else {
      input.setCustomValidity("");
    }
  }, [isUnavailable]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative space-y-2">
      <Label htmlFor="boothCode">Booth code</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="boothCode"
          name="boothCode"
          required
          autoComplete="off"
          placeholder="Type or select e.g. A8"
          value={value}
          onChange={(event) => {
            setValue(event.target.value.toUpperCase());
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            "bg-background pr-10 uppercase",
            isUnavailable && "border-destructive"
          )}
        />
        <button
          type="button"
          aria-label="Toggle booth list"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--partner-primary)]"
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matching booths. You can still type a booth code manually.
            </p>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((booth) => {
                const selectable = isBoothSelectable(booth);
                const selected = value.trim().toUpperCase() === booth.code;
                return (
                  <li key={booth.code}>
                    <button
                      type="button"
                      disabled={!selectable}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                        selectable
                          ? selected
                            ? "bg-[var(--partner-primary)]/10 hover:bg-muted/70"
                            : "hover:bg-muted/70"
                          : "cursor-not-allowed opacity-60"
                      )}
                      onClick={() => {
                        if (!selectable) return;
                        setValue(booth.code);
                        setOpen(false);
                      }}
                    >
                      <span className="font-semibold tracking-wide">{booth.code}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          selectable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        )}
                      >
                        {boothStatusLabel(booth)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
      {isUnavailable ? (
        <p className="text-xs text-destructive">
          {boothStatusLabel(matchedBooth!)} — choose an available booth.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Type a booth code or pick from available stands.
        </p>
      )}
    </div>
  );
}

function AddExhibitorForm({
  partnerSlug,
  events,
  boothOptionsByEvent,
}: {
  partnerSlug: string;
  events: PartnerEvent[];
  boothOptionsByEvent: Record<string, BoothOption[]>;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  const boothOptions = useMemo(() => {
    if (!selectedEventId) return [];
    return boothOptionsByEvent[selectedEventId] ?? [];
  }, [boothOptionsByEvent, selectedEventId]);

  if (events.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">No events available yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish an expo event first, then return here to add exhibitors manually.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={createManualPartnerExhibitor} className="space-y-6">
      <input type="hidden" name="partnerSlug" value={partnerSlug} />

      <Card className="border-[color-mix(in_oklab,var(--partner-primary)_15%,transparent)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Event &amp; booth</CardTitle>
              <CardDescription>Choose the event and assign a stand</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event</Label>
            <select
              id="eventId"
              name="eventId"
              required
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm transition-colors focus:border-[var(--partner-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--partner-primary)]/20"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <BoothCodeCombobox key={selectedEventId} boothOptions={boothOptions} />
        </CardContent>
      </Card>

      <Card className="border-[color-mix(in_oklab,var(--partner-primary)_15%,transparent)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Exhibitor contact</CardTitle>
              <CardDescription>Details from the phone or offline booking</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              placeholder="Acme Ltd"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input
              id="contactName"
              name="contactName"
              required
              placeholder="Jane Doe"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              placeholder="jane@acme.com"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              placeholder="+254..."
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-2xl border border-[color-mix(in_oklab,var(--partner-primary)_20%,transparent)] bg-[color-mix(in_oklab,var(--partner-primary)_6%,white)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--partner-primary)]/15 text-[var(--partner-primary)]">
            <Mail className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">
            A booth reservation email is sent immediately. Login credentials are sent after you
            confirm payment on the exhibitor list.
          </p>
        </div>
        <Button
          type="submit"
          className="shrink-0 bg-[var(--partner-primary)] font-semibold text-white shadow-sm hover:opacity-90"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add exhibitor
        </Button>
      </div>
    </form>
  );
}

function CreateEventForm({
  partnerSlug,
  categories,
  venues,
}: {
  partnerSlug: string;
  categories: CategoryOption[];
  venues: VenueOption[];
}) {
  if (categories.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Categories not set up yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask an AxarEvents admin to add event categories before creating events.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={createPartnerOrganizerEvent} className="space-y-6">
      <input type="hidden" name="partnerSlug" value={partnerSlug} />

      <Card className="border-[color-mix(in_oklab,var(--partner-primary)_15%,transparent)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Event details</CardTitle>
              <CardDescription>
                Published on your partner site and available for booth assignments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event title</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={3}
              placeholder="e.g. TechHub Africa Expo 2026"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              placeholder="One-line summary for listings"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={20}
              rows={5}
              placeholder="Describe the event for visitors and exhibitors (at least 20 characters)"
              className="bg-background"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                required
                defaultValue="EXPO"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus:border-[var(--partner-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--partner-primary)]/20"
              >
                {PARTNER_EVENT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus:border-[var(--partner-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--partner-primary)]/20"
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[color-mix(in_oklab,var(--partner-primary)_15%,transparent)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Schedule &amp; venue</CardTitle>
              <CardDescription>When and where the event takes place</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" required className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" name="startTime" type="time" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" name="endTime" type="time" className="bg-background" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venueId">Venue</Label>
              <select
                id="venueId"
                name="venueId"
                defaultValue=""
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus:border-[var(--partner-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--partner-primary)]/20"
              >
                <option value="">No venue / TBA</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} · {venue.city}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                placeholder="e.g. 500"
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-2xl border border-[color-mix(in_oklab,var(--partner-primary)_20%,transparent)] bg-[color-mix(in_oklab,var(--partner-primary)_6%,white)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--partner-primary)]/15 text-[var(--partner-primary)]">
            <PlusCircle className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">
            The event is published on your partner site with a free visitor pass and floor-plan
            booths ready for exhibitor assignment.
          </p>
        </div>
        <Button
          type="submit"
          className="shrink-0 bg-[var(--partner-primary)] font-semibold text-white shadow-sm hover:opacity-90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create &amp; publish event
        </Button>
      </div>
    </form>
  );
}

function ExhibitorCard({
  row,
  partnerSlug,
}: {
  row: ExhibitorRow;
  partnerSlug: string;
}) {
  const paymentDone = Boolean(row.eventBooth?.paymentVerified);
  const paymentDate = row.eventBooth?.paymentVerifiedAt
    ? formatDate(row.eventBooth.paymentVerifiedAt)
    : null;
  const boothCode = row.eventBooth?.code || row.boothNumber || null;
  const boothStatus = paymentDone
    ? "Occupied"
    : boothCode
      ? "Reserved"
      : "Not assigned";
  const email = row.exhibitor.contactEmail || row.exhibitor.user?.email;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: "var(--partner-primary)" }}
            >
              {companyInitials(row.exhibitor.companyName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold tracking-tight">{row.exhibitor.companyName}</h3>
                <Badge variant={paymentDone ? "success" : "warning"}>
                  {paymentDone ? "Paid" : "Payment pending"}
                </Badge>
                <Badge variant="outline">{boothStatus}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.exhibitor.contactName || "No contact"}
                {email ? ` · ${email}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {row.event.title}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--partner-primary)]" />
                  {boothCode ?? "No booth"}
                </span>
              </div>
              {paymentDone && paymentDate ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Payment confirmed {paymentDate}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-border/80 bg-muted/30 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workflow
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <form
              action={confirmPartnerExhibitorPaymentManually}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    paymentDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[var(--partner-primary)]/15 text-[var(--partner-primary)]"
                  )}
                >
                  1
                </span>
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input type="hidden" name="partnerSlug" value={partnerSlug} />
                <input type="hidden" name="eventExhibitorId" value={row.id} />
                <input
                  type="text"
                  name="paymentReference"
                  placeholder="Payment reference (optional)"
                  disabled={paymentDone}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={paymentDone}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--partner-primary)] bg-white px-4 py-2 text-sm font-semibold text-[var(--partner-primary)] shadow-sm transition-colors hover:bg-[var(--partner-primary)]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmed
                  </>
                ) : (
                  "Confirm payment"
                )}
              </button>
            </form>

            <form
              action={sendPartnerExhibitorPaymentConfirmation}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    paymentDone
                      ? "bg-[var(--partner-primary)]/15 text-[var(--partner-primary)]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  2
                </span>
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Send login credentials</span>
                <input type="hidden" name="partnerSlug" value={partnerSlug} />
                <input type="hidden" name="eventExhibitorId" value={row.id} />
              </div>
              <button
                type="submit"
                disabled={!paymentDone}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--partner-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                Send login mail
              </button>
            </form>
          </div>
          {!paymentDone ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Confirm payment first, then send the login email.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function PartnerOrganizerDashboard({
  partnerSlug,
  partnerName,
  events,
  rows,
  categories,
  venues,
  boothOptionsByEvent,
  notice,
  initialTab = "add",
}: {
  partnerSlug: string;
  partnerName: string;
  events: PartnerEvent[];
  rows: ExhibitorRow[];
  categories: CategoryOption[];
  venues: VenueOption[];
  boothOptionsByEvent: Record<string, BoothOption[]>;
  notice: { type: "success" | "error" | "info"; message: string } | null;
  initialTab?: TabId;
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const noticedKey = useRef<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!notice) return;
    const key = `${notice.type}:${notice.message}`;
    if (noticedKey.current === key) return;
    noticedKey.current = key;

    if (notice.type === "success") {
      toast.success(notice.message);
    } else if (notice.type === "error") {
      toast.error(notice.message);
    } else {
      toast.info(notice.message);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("mail");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, pathname, router, searchParams]);

  const setTab = (tab: TabId) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("mail");
    if (tab === "add") next.delete("tab");
    else next.set("tab", tab);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const totalReserved = rows.filter(
    (row) => row.eventBooth && !row.eventBooth.paymentVerified
  ).length;
  const totalPaid = rows.filter((row) => row.eventBooth?.paymentVerified).length;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const booth = row.eventBooth?.code || row.boothNumber || "";
      const email = row.exhibitor.contactEmail || row.exhibitor.user?.email || "";
      return (
        row.exhibitor.companyName.toLowerCase().includes(q) ||
        (row.exhibitor.contactName?.toLowerCase().includes(q) ?? false) ||
        email.toLowerCase().includes(q) ||
        booth.toLowerCase().includes(q) ||
        row.event.title.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery]);

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] =
    [
      { id: "events", label: "Create event", icon: PlusCircle },
      { id: "add", label: "Add exhibitor", icon: UserPlus },
      { id: "list", label: `Exhibitors (${rows.length})`, icon: Users },
    ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <a
        href={partnerPath(partnerSlug)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--partner-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {partnerName}
      </a>

      <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--partner-primary)_25%,transparent)] bg-[var(--partner-secondary)] text-white shadow-lg">
        <div aria-hidden className="partner-spotlight-glow pointer-events-none absolute inset-0" />
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <LayoutDashboard className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/70">Organizer dashboard</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {partnerName}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                  Manage exhibitors from phone bookings — assign booths, confirm payments, and
                  send login credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                Total exhibitors
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                Awaiting payment
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{totalReserved}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                Payment confirmed
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{totalPaid}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="inline-flex w-full flex-col gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:w-auto sm:flex-row">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--partner-primary)] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "events" ? (
        <section className="mt-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Create your event</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Publish a new expo or conference for {partnerName}. It appears on your partner site
                and in the Add exhibitor flow.
              </p>
            </div>
            {events.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {events.length} event{events.length === 1 ? "" : "s"} available for booth booking
              </p>
            ) : null}
          </div>

          {events.length > 0 ? (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="border-[color-mix(in_oklab,var(--partner-primary)_12%,transparent)]"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{event.title}</p>
                        {event.startDate ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Starts {formatDate(event.startDate)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <CreateEventForm
            partnerSlug={partnerSlug}
            categories={categories}
            venues={venues}
          />
        </section>
      ) : activeTab === "add" ? (
        <section className="mt-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Add exhibitor manually</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter details after a phone or offline booking. A booth reservation email is sent
              automatically.
            </p>
          </div>
          {events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Create an event first</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    You need at least one published event before assigning booths to exhibitors.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setTab("events")}
                  className="bg-[var(--partner-primary)] text-white hover:opacity-90"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AddExhibitorForm
              partnerSlug={partnerSlug}
              events={events}
              boothOptionsByEvent={boothOptionsByEvent}
            />
          )}
        </section>
      ) : rows.length === 0 ? (
        <Card className="mt-6 border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No exhibitors yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When you add exhibitors manually, they will appear here for payment confirmation
                and credential emails.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setTab("add")}
              className="bg-[var(--partner-primary)] text-white hover:opacity-90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add your first exhibitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Total exhibitors" value={rows.length} icon={Users} />
            <StatCard
              label="Awaiting payment"
              value={totalReserved}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="Payment confirmed"
              value={totalPaid}
              icon={CheckCircle2}
              tone="success"
            />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by company, contact, booth, or event…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-card pl-9"
            />
          </div>

          {filteredRows.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No exhibitors match &ldquo;{searchQuery}&rdquo;.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRows.map((row) => (
                <ExhibitorCard key={row.id} row={row} partnerSlug={partnerSlug} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
