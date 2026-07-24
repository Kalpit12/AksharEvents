"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BOOTH_STATUS_COLORS,
  BOOTH_STATUS_LABELS,
  STAND_TYPE_LABELS,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import {
  allocateBoothToExhibitor,
  releaseBoothReservation,
  updateEventBooth,
  updateEventBoothFee,
  verifyBoothPayment,
} from "@/lib/floor-plan-actions";
import { scaledLayoutForBoothCode } from "@/lib/floor-plan-scale";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";

type Props = {
  eventId: string;
  initialBooths: FloorPlanBoothRecord[];
  initialFloorPlan: EventFloorPlanConfig;
  initialBoothFee?: number | null;
  initialBoothFeeCurrency?: string;
  exhibitors: AdminExhibitorRecord[];
};

const STATUS_OPTIONS = (Object.keys(BOOTH_STATUS_LABELS) as BoothStatusValue[]).map((value) => ({
  value,
  label: BOOTH_STATUS_LABELS[value],
}));

function boothFormFromRecord(booth: FloorPlanBoothRecord) {
  return {
    status: booth.status,
    exhibitorId: booth.eventExhibitorId ?? "",
    companyName: booth.companyName ?? booth.exhibitorName ?? "",
    contactName: booth.contactName ?? "",
    contactPhone: booth.contactPhone ?? "",
    contactEmail: booth.contactEmail ?? "",
    notes: booth.notes ?? "",
  };
}

function reservationBanner(booth: FloorPlanBoothRecord) {
  if (booth.status === "OCCUPIED" && booth.eventExhibitorId) {
    return {
      label: "Allocated",
      detail: `${booth.companyName ?? booth.exhibitorName ?? "Company"} · booth confirmed`,
      className: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
    };
  }
  if (booth.status === "RESERVED" && booth.eventExhibitorId) {
    if (booth.paymentVerified) {
      return {
        label: "Payment verified — ready to allocate",
        detail: `${booth.companyName ?? booth.exhibitorName ?? "Company"} requested this booth`,
        className: "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200",
      };
    }
    return {
      label: "Exhibitor request — verify payment",
      detail: `${booth.companyName ?? booth.exhibitorName ?? "Company"} asked for this booth`,
      className: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
    };
  }
  return null;
}

export default function FloorPlanPanel({
  eventId,
  initialBooths,
  initialFloorPlan,
  initialBoothFee = null,
  initialBoothFeeCurrency = "KES",
  exhibitors,
}: Props) {
  const [booths, setBooths] = useState(initialBooths);
  const [floorPlan, setFloorPlan] = useState(initialFloorPlan);
  const [boothFeeInput, setBoothFeeInput] = useState(
    initialBoothFee != null ? String(initialBoothFee) : ""
  );
  const [boothFeeCurrencyInput, setBoothFeeCurrencyInput] = useState(initialBoothFeeCurrency);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BoothStatusValue>("AVAILABLE");
  const [exhibitorId, setExhibitorId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const detailsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => booths.find((b) => b.code === selectedCode) ?? null,
    [booths, selectedCode]
  );

  const exhibitorOptions = useMemo(
    () =>
      exhibitors.map((e) => ({
        value: e.id,
        label: e.companyName,
      })),
    [exhibitors]
  );

  const selectBooth = useCallback(
    (code: string) => {
      const booth = booths.find((b) => b.code === code);
      if (!booth) return;
      const form = boothFormFromRecord(booth);
      setSelectedCode(code);
      setStatus(form.status);
      setExhibitorId(form.exhibitorId);
      setCompanyName(form.companyName);
      setContactName(form.contactName);
      setContactPhone(form.contactPhone);
      setContactEmail(form.contactEmail);
      setNotes(form.notes);
      setMessage(null);
    },
    [booths]
  );

  const handleExhibitorChange = (id: string) => {
    setExhibitorId(id);
    if (!id) return;
    const exhibitor = exhibitors.find((e) => e.id === id);
    if (!exhibitor) return;
    setCompanyName(exhibitor.companyName);
    setContactName(exhibitor.contactName ?? "");
    setContactPhone(exhibitor.contactPhone ?? "");
    setContactEmail(exhibitor.contactEmail ?? "");
  };

  const handleSearch = () => {
    const q = search.trim().toUpperCase();
    if (!q) return;
    const match = booths.find((b) => b.code === q);
    if (match) selectBooth(match.code);
    else setMessage(`No booth found for "${q}".`);
  };

  const patchSelectedBooth = (patch: Partial<FloorPlanBoothRecord>) => {
    if (!selectedCode) return;
    setBooths((current) =>
      current.map((b) => {
        if (b.code === selectedCode) return { ...b, ...patch };
        if (
          patch.eventExhibitorId &&
          b.eventExhibitorId === patch.eventExhibitorId &&
          b.code !== selectedCode
        ) {
          return {
            ...b,
            status: "AVAILABLE" as BoothStatusValue,
            eventExhibitorId: null,
            exhibitorName: null,
            companyName: null,
            contactName: null,
            contactPhone: null,
            contactEmail: null,
            reservedAt: null,
            paymentVerified: false,
            paymentVerifiedAt: null,
          };
        }
        return b;
      })
    );
  };

  const saveBooth = (opts?: { allocate?: boolean; forceAllocate?: boolean }) => {
    if (!selectedCode) {
      setMessage("Select a booth on the plan first.");
      return;
    }

    startTransition(async () => {
      const result = await updateEventBooth({
        eventId,
        boothCode: selectedCode,
        status,
        eventExhibitorId: exhibitorId || null,
        companyName,
        contactName,
        contactPhone,
        contactEmail,
        notes,
        allocate: opts?.allocate,
        forceAllocate: opts?.forceAllocate,
      });

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      const nextStatus: BoothStatusValue =
        (result.status as BoothStatusValue | undefined) ??
        (exhibitorId
          ? opts?.allocate
            ? "OCCUPIED"
            : "RESERVED"
          : status === "OCCUPIED"
            ? "AVAILABLE"
            : status);

      patchSelectedBooth({
        status: nextStatus,
        eventExhibitorId: exhibitorId || null,
        exhibitorName:
          companyName.trim() || exhibitors.find((e) => e.id === exhibitorId)?.companyName || null,
        companyName: companyName.trim() || null,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        notes: notes.trim() || null,
        reservedAt:
          exhibitorId && nextStatus === "RESERVED"
            ? selected?.reservedAt ?? new Date().toISOString()
            : exhibitorId
              ? selected?.reservedAt ?? null
              : null,
      });
      setStatus(nextStatus);
      setMessage(opts?.allocate ? "Booth allocated to exhibitor." : "Booth details saved.");
      router.refresh();
    });
  };

  const verifyPayment = () => {
    if (!selectedCode) return;
    startTransition(async () => {
      const result = await verifyBoothPayment({ eventId, boothCode: selectedCode });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      patchSelectedBooth({
        paymentVerified: true,
        paymentVerifiedAt: new Date().toISOString(),
      });
      setMessage("Payment verified. You can now allocate this booth.");
      router.refresh();
    });
  };

  const allocateBooth = (force = false) => {
    if (!selectedCode) return;
    startTransition(async () => {
      const result = await allocateBoothToExhibitor({
        eventId,
        boothCode: selectedCode,
        forceAllocate: force,
      });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      patchSelectedBooth({
        status: "OCCUPIED",
        paymentVerified: true,
        paymentVerifiedAt: selected?.paymentVerifiedAt ?? new Date().toISOString(),
      });
      setStatus("OCCUPIED");
      setMessage("Booth allocated to the requesting company.");
      router.refresh();
    });
  };

  const releaseBooth = () => {
    if (!selectedCode) return;
    startTransition(async () => {
      const result = await releaseBoothReservation({ eventId, boothCode: selectedCode });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setExhibitorId("");
      setCompanyName("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setNotes("");
      setStatus("AVAILABLE");
      patchSelectedBooth({
        status: "AVAILABLE",
        eventExhibitorId: null,
        exhibitorName: null,
        companyName: null,
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        reservedAt: null,
        paymentVerified: false,
        paymentVerifiedAt: null,
      });
      setMessage("Booth released and marked available.");
      router.refresh();
    });
  };

  const clearForm = () => {
    if (!selectedCode) return;
    setExhibitorId("");
    setCompanyName("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setNotes("");
    setStatus("AVAILABLE");
  };

  const rescaleBoothsForViewBox = (viewBox: EventFloorPlanConfig["viewBox"], current: FloorPlanBoothRecord[]) =>
    current.map((booth) => {
      const geometry = scaledLayoutForBoothCode(booth.code, viewBox);
      return { ...booth, ...geometry };
    });

  const handleFloorPlanUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("eventId", eventId);
      body.append("file", file);

      const response = await fetch("/api/admin/floor-plan/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Upload failed");
        return;
      }

      const nextPlan = result.floorPlan as EventFloorPlanConfig;
      setFloorPlan(nextPlan);
      setBooths((current) => rescaleBoothsForViewBox(nextPlan.viewBox, current));
      setMessage("Floor plan uploaded and converted to interactive SVG.");
      router.refresh();
    } catch {
      setMessage("Could not upload floor plan. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveBoothFee = () => {
    startTransition(async () => {
      const trimmed = boothFeeInput.trim();
      const fee = trimmed === "" ? null : Number(trimmed);
      if (fee != null && Number.isNaN(fee)) {
        setMessage("Booth fee must be a number.");
        return;
      }
      const result = await updateEventBoothFee({
        eventId,
        boothFee: fee,
        boothFeeCurrency: boothFeeCurrencyInput,
      });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        fee == null || fee === 0
          ? "Booth fee cleared (manual payment verification)."
          : `Booth fee saved: ${boothFeeCurrencyInput.toUpperCase()} ${fee}`
      );
      router.refresh();
    });
  };

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[400px] flex-col gap-2 overflow-hidden xl:flex-row xl:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 flex-wrap items-end gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <div className="min-w-[120px]">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Booth fee (main site)
            </label>
            <Input
              value={boothFeeInput}
              onChange={(e) => setBoothFeeInput(e.target.value)}
              placeholder="e.g. 50000"
              className="h-9"
              inputMode="decimal"
            />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Currency
            </label>
            <Input
              value={boothFeeCurrencyInput}
              onChange={(e) => setBoothFeeCurrencyInput(e.target.value.toUpperCase())}
              placeholder="KES"
              className="h-9"
              maxLength={3}
            />
          </div>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={saveBoothFee}>
            Save fee
          </Button>
          <p className="pb-1 text-xs text-muted-foreground">
            Used for PayPal booth checkout when PayPal is enabled. Leave empty for manual verification only.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFloorPlanUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading…" : floorPlan.isCustom ? "Replace floor plan" : "Upload floor plan"}
          </Button>
          {floorPlan.svgUrl ? (
            <Button type="button" variant="ghost" size="sm" asChild>
              <a href={floorPlan.svgUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-1.5 h-4 w-4" />
                SVG
              </a>
            </Button>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {floorPlan.isCustom
              ? `Custom plan · ${floorPlan.viewBox.width}×${floorPlan.viewBox.height}px`
              : "Default plan · upload PNG/JPEG for this event"}
          </span>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Jump to booth e.g. A13"
              className="h-9 pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleSearch}>
            Find
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
            {(Object.keys(BOOTH_STATUS_LABELS) as BoothStatusValue[]).map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded border border-black/15"
                  style={{ background: BOOTH_STATUS_COLORS[key] }}
                />
                {BOOTH_STATUS_LABELS[key]}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-white">
          <svg
            viewBox={`0 0 ${floorPlan.viewBox.width} ${floorPlan.viewBox.height}`}
            className="absolute inset-0 h-full w-full select-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Interactive exhibition floor plan"
          >
            <image
              href={floorPlan.imageUrl}
              x={0}
              y={0}
              width={floorPlan.viewBox.width}
              height={floorPlan.viewBox.height}
              preserveAspectRatio="xMidYMid meet"
            />

            {booths.map((booth) => {
              const isSelected = booth.code === selectedCode;
              const fill = BOOTH_STATUS_COLORS[booth.status];
              return (
                <rect
                  key={booth.code}
                  x={booth.x}
                  y={booth.y}
                  width={booth.w}
                  height={booth.h}
                  fill={fill}
                  fillOpacity={isSelected ? 0.5 : 0.22}
                  stroke={isSelected ? "#6f5cff" : "transparent"}
                  strokeWidth={isSelected ? 3 : 0}
                  rx={2}
                  className="cursor-pointer"
                  onClick={() => selectBooth(booth.code)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.setAttribute("fillOpacity", "0.38");
                      e.currentTarget.setAttribute("stroke", "#374151");
                      e.currentTarget.setAttribute("strokeWidth", "1.5");
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.setAttribute("fillOpacity", "0.22");
                      e.currentTarget.setAttribute("stroke", "transparent");
                      e.currentTarget.setAttribute("strokeWidth", "0");
                    }
                  }}
                >
                  <title>
                    {`${booth.code} — ${BOOTH_STATUS_LABELS[booth.status]}${
                      booth.companyName || booth.exhibitorName
                        ? ` · ${booth.companyName ?? booth.exhibitorName}`
                        : ""
                    }`}
                  </title>
                </rect>
              );
            })}
          </svg>
        </div>
      </div>

      <aside
        ref={detailsRef}
        className="flex max-h-[38vh] shrink-0 flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm xl:h-full xl:max-h-none xl:w-[360px]"
      >
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Booth details</h3>
            </div>
            {!selected ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No booth selected — click one on the floor plan.
              </p>
            ) : (
              <p className="mt-1 text-sm">
                Editing <span className="font-semibold text-primary">{selected.code}</span>
                <span className="text-muted-foreground"> · {STAND_TYPE_LABELS[selected.standType]}</span>
              </p>
            )}
          </div>

          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Select a booth to edit</p>
              <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                Click any coloured area on the map, or search by booth number above.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {(() => {
                const banner = reservationBanner(selected);
                if (!banner) return null;
                return (
                  <div className={cn("rounded-lg border px-3 py-2.5 text-sm", banner.className)}>
                    <p className="font-semibold">{banner.label}</p>
                    <p className="mt-0.5 text-xs opacity-90">{banner.detail}</p>
                    {selected.reservedAt ? (
                      <p className="mt-1 text-xs opacity-80">
                        Requested {new Date(selected.reservedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                );
              })()}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                {selected.status === "OCCUPIED" && exhibitorId ? (
                  <div className="rounded-lg border border-border bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Occupied (allocated to exhibitor)
                  </div>
                ) : selected.status === "RESERVED" && exhibitorId ? (
                  <div className="rounded-lg border border-border bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Reserved (exhibitor request
                    {selected.paymentVerified ? " · payment verified" : " · payment pending"})
                  </div>
                ) : (
                  <CustomSelect
                    value={status}
                    onChange={(value) => setStatus(value as BoothStatusValue)}
                    options={STATUS_OPTIONS}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Link exhibitor (optional)
                </label>
                <CustomSelect
                  value={exhibitorId}
                  onChange={handleExhibitorChange}
                  placeholder="Manual entry only"
                  options={[{ value: "", label: "Manual entry only" }, ...exhibitorOptions]}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupant details</p>

                <div>
                  <label htmlFor="booth-company" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Company / occupant
                  </label>
                  <Input
                    id="booth-company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label htmlFor="booth-contact" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Contact person
                  </label>
                  <Input
                    id="booth-contact"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <label htmlFor="booth-phone" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </label>
                  <Input
                    id="booth-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label htmlFor="booth-email" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </label>
                  <Input
                    id="booth-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="booth-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </label>
                <textarea
                  id="booth-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes, setup requirements, etc."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {exhibitorId && selected.status === "RESERVED" ? (
                <div className="flex flex-col gap-2">
                  {!selected.paymentVerified ? (
                    <Button type="button" onClick={verifyPayment} disabled={pending} className="gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      {pending ? "Verifying…" : "Verify payment"}
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => allocateBooth(false)} disabled={pending} className="gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      {pending ? "Allocating…" : "Allocate booth to company"}
                    </Button>
                  )}
                  {selected.paymentVerified ? null : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => allocateBooth(true)}
                      disabled={pending}
                      className="text-xs"
                    >
                      Force allocate without payment verify
                    </Button>
                  )}
                </div>
              ) : null}

              {exhibitorId && selected.status === "OCCUPIED" && !selected.paymentVerified ? (
                <Button type="button" variant="outline" onClick={verifyPayment} disabled={pending} className="w-full gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Mark payment verified
                </Button>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" className="flex-1" onClick={() => saveBooth()} disabled={pending}>
                  {pending ? "Saving…" : exhibitorId && status !== "OCCUPIED" ? "Save as reserved" : "Save booth"}
                </Button>
                {exhibitorId ? (
                  <Button type="button" variant="outline" onClick={releaseBooth} disabled={pending}>
                    Release
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={clearForm} disabled={pending}>
                    Clear
                  </Button>
                )}
              </div>

              {message ? (
                <p
                  className={cn(
                    "text-center text-sm",
                    message.toLowerCase().includes("saved") ||
                      message.toLowerCase().includes("verified") ||
                      message.toLowerCase().includes("allocated") ||
                      message.toLowerCase().includes("released")
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  )}
                >
                  {message}
                </p>
              ) : null}
            </div>
          )}
        </aside>
    </div>
  );
}
