"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  BOOTH_STATUS_COLORS,
  BOOTH_STATUS_LABELS,
  FLOOR_PLAN_IMAGE,
  FLOOR_PLAN_VIEWBOX,
  STAND_TYPE_LABELS,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import { updateEventBooth } from "@/lib/floor-plan-actions";
import type { FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Building2, Mail, MapPin, Phone, Search, User } from "lucide-react";

type Props = {
  eventId: string;
  initialBooths: FloorPlanBoothRecord[];
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
    companyName: booth.companyName ?? "",
    contactName: booth.contactName ?? "",
    contactPhone: booth.contactPhone ?? "",
    contactEmail: booth.contactEmail ?? "",
    notes: booth.notes ?? "",
  };
}

export default function FloorPlanPanel({ eventId, initialBooths, exhibitors }: Props) {
  const [booths, setBooths] = useState(initialBooths);
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
  const [pending, startTransition] = useTransition();
  const detailsRef = useRef<HTMLDivElement>(null);

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

  const saveBooth = () => {
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
      });

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      const nextStatus: BoothStatusValue = exhibitorId ? "OCCUPIED" : status === "OCCUPIED" ? "AVAILABLE" : status;

      setBooths((current) =>
        current.map((b) => {
          if (b.code === selectedCode) {
            return {
              ...b,
              status: nextStatus,
              eventExhibitorId: exhibitorId || null,
              exhibitorName: companyName.trim() || exhibitors.find((e) => e.id === exhibitorId)?.companyName || null,
              companyName: companyName.trim() || null,
              contactName: contactName.trim() || null,
              contactPhone: contactPhone.trim() || null,
              contactEmail: contactEmail.trim() || null,
              notes: notes.trim() || null,
            };
          }
          if (exhibitorId && b.eventExhibitorId === exhibitorId && b.code !== selectedCode) {
            return {
              ...b,
              status: "AVAILABLE",
              eventExhibitorId: null,
              exhibitorName: null,
              companyName: null,
              contactName: null,
              contactPhone: null,
              contactEmail: null,
            };
          }
          return b;
        })
      );
      setStatus(nextStatus);
      setMessage("Booth details saved.");
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

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[400px] flex-col gap-2 overflow-hidden xl:flex-row xl:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            viewBox={`0 0 ${FLOOR_PLAN_VIEWBOX.width} ${FLOOR_PLAN_VIEWBOX.height}`}
            className="absolute inset-0 h-full w-full select-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Interactive exhibition floor plan"
          >
            <image
              href={FLOOR_PLAN_IMAGE}
              x={0}
              y={0}
              width={FLOOR_PLAN_VIEWBOX.width}
              height={FLOOR_PLAN_VIEWBOX.height}
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                {exhibitorId ? (
                  <div className="rounded-lg border border-border bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Occupied (exhibitor linked)
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

              <div className="flex gap-2 pt-1">
                <Button type="button" className="flex-1" onClick={saveBooth} disabled={pending}>
                  {pending ? "Saving…" : "Save booth"}
                </Button>
                <Button type="button" variant="outline" onClick={clearForm} disabled={pending}>
                  Clear
                </Button>
              </div>

              {message ? (
                <p
                  className={cn(
                    "text-center text-sm",
                    message === "Booth details saved." ? "text-emerald-600" : "text-muted-foreground"
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
