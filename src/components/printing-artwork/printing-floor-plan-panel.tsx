"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BRANDING_ARTWORK_STATUS_BADGE,
  BRANDING_ARTWORK_STATUS_FILL,
  BRANDING_ARTWORK_STATUS_LABELS,
  PRINTING_FLOOR_PLAN_LEGEND_STATUSES,
  PRINTING_FLOOR_PLAN_NO_ARTWORK_FILL,
  PRINTING_FLOOR_PLAN_UNASSIGNED_FILL,
  type AdminBrandingArtworkRecord,
} from "@/lib/branding-artwork-types";
import { STAND_TYPE_LABELS } from "@/lib/floor-plan-layout";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import {
  buildBoothArtworkSummaries,
  findUnmappedArtworkRecords,
} from "@/lib/printing-floor-plan-matching";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { AlertTriangle, Building2, MapPin, Search } from "lucide-react";

type Props = {
  floorPlan: EventFloorPlanConfig;
  booths: FloorPlanBoothRecord[];
  records: AdminBrandingArtworkRecord[];
  onOpenCompany?: (eventExhibitorId: string) => void;
};

export default function PrintingFloorPlanPanel({
  floorPlan,
  booths,
  records,
  onOpenCompany,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const summaries = useMemo(
    () => buildBoothArtworkSummaries(booths, records),
    [booths, records]
  );

  const unmappedRecords = useMemo(
    () => findUnmappedArtworkRecords(summaries, records),
    [summaries, records]
  );

  const summaryByCode = useMemo(
    () => new Map(summaries.map((summary) => [summary.boothCode, summary])),
    [summaries]
  );

  const selectedBooth = useMemo(
    () => booths.find((booth) => booth.code === selectedCode) ?? null,
    [booths, selectedCode]
  );

  const selectedSummary = selectedCode ? summaryByCode.get(selectedCode) ?? null : null;

  const selectBooth = useCallback((code: string) => {
    setSelectedCode(code);
  }, []);

  const handleSearch = () => {
    const q = search.trim().toUpperCase();
    if (!q) return;
    const match = booths.find((booth) => booth.code === q);
    if (match) selectBooth(match.code);
  };

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col gap-2 overflow-hidden xl:flex-row xl:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {unmappedRecords.length > 0 ? (
          <div className="flex shrink-0 items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {unmappedRecords.length} artwork item{unmappedRecords.length === 1 ? "" : "s"} not
                placed on the floor plan
              </p>
              <p className="mt-0.5 text-amber-900/80 dark:text-amber-200/80">
                Assign a booth in Event Master or set booth numbers on exhibitor registrations:{" "}
                {[
                  ...new Set(
                    unmappedRecords.map(
                      (row) => `${row.companyName}${row.boothNumber ? ` (${row.boothNumber})` : ""}`
                    )
                  ),
                ].join(", ")}
              </p>
            </div>
          </div>
        ) : null}

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
            {PRINTING_FLOOR_PLAN_LEGEND_STATUSES.map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded border border-black/15"
                  style={{ background: BRANDING_ARTWORK_STATUS_FILL[status] }}
                />
                {BRANDING_ARTWORK_STATUS_LABELS[status].split(" —")[0]}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded border border-black/15"
                style={{ background: PRINTING_FLOOR_PLAN_NO_ARTWORK_FILL }}
              />
              No artwork
            </span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-white">
          <svg
            viewBox={`0 0 ${floorPlan.viewBox.width} ${floorPlan.viewBox.height}`}
            className="absolute inset-0 h-full w-full select-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Exhibition floor plan with artwork status colours"
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
              const summary = summaryByCode.get(booth.code);
              const isSelected = booth.code === selectedCode;
              const fill = summary?.fillColor ?? PRINTING_FLOOR_PLAN_UNASSIGNED_FILL;
              const statusLabel = summary?.aggregateStatus
                ? BRANDING_ARTWORK_STATUS_LABELS[summary.aggregateStatus]
                : summary?.companyName || (summary?.submissions.length ?? 0) > 0
                  ? "No artwork submitted"
                  : "Unassigned";

              return (
                <rect
                  key={booth.code}
                  x={booth.x}
                  y={booth.y}
                  width={booth.w}
                  height={booth.h}
                  fill={fill}
                  fillOpacity={isSelected ? 0.55 : 0.32}
                  stroke={isSelected ? "#6f5cff" : "transparent"}
                  strokeWidth={isSelected ? 3 : 0}
                  rx={2}
                  className="cursor-pointer"
                  onClick={() => selectBooth(booth.code)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.setAttribute("fillOpacity", "0.48");
                      e.currentTarget.setAttribute("stroke", "#374151");
                      e.currentTarget.setAttribute("strokeWidth", "1.5");
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.setAttribute("fillOpacity", "0.32");
                      e.currentTarget.setAttribute("stroke", "transparent");
                      e.currentTarget.setAttribute("strokeWidth", "0");
                    }
                  }}
                >
                  <title>
                    {`${booth.code}${summary?.companyName ? ` · ${summary.companyName}` : ""} — ${statusLabel}${
                      summary && summary.submissions.length > 1
                        ? ` · ${summary.submissions.length} items`
                        : ""
                    }`}
                  </title>
                </rect>
              );
            })}
          </svg>
        </div>
      </div>

      <aside className="flex max-h-[38vh] shrink-0 flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm xl:h-full xl:max-h-none xl:w-[360px]">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Booth artwork</h3>
          </div>
          {!selectedBooth ? (
            <p className="mt-1 text-sm text-muted-foreground">
              No booth selected — click one on the floor plan.
            </p>
          ) : (
            <p className="mt-1 text-sm">
              <span className="font-semibold text-primary">{selectedBooth.code}</span>
              <span className="text-muted-foreground">
                {" "}
                · {STAND_TYPE_LABELS[selectedBooth.standType]}
              </span>
            </p>
          )}
        </div>

        {!selectedBooth || !selectedSummary ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Select a booth</p>
            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
              Click any coloured area to see the exhibitor company and artwork production status.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {selectedSummary.companyName ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Company
                    </p>
                    <p className="text-sm font-semibold">{selectedSummary.companyName}</p>
                  </div>
                </div>
                {selectedSummary.eventExhibitorId && onOpenCompany ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full text-xs"
                    onClick={() => onOpenCompany(selectedSummary.eventExhibitorId!)}
                  >
                    Open company artwork
                  </Button>
                ) : null}
              </div>
            ) : selectedSummary.submissions.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Company
                </p>
                <p className="text-sm font-semibold">{selectedSummary.submissions[0]!.companyName}</p>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-4 text-center text-sm text-muted-foreground">
                No exhibitor assigned to this booth.
              </p>
            )}

            {selectedSummary.submissions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Artwork items ({selectedSummary.submissions.length})
                </p>
                {selectedSummary.submissions.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <p className="text-sm font-medium">{row.itemName}</p>
                    <p className="text-[11px] text-muted-foreground">{row.itemCategory}</p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                        BRANDING_ARTWORK_STATUS_BADGE[row.status]
                      )}
                    >
                      {BRANDING_ARTWORK_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                ))}
              </div>
            ) : selectedSummary.companyName ? (
              <p className="rounded-lg bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                This exhibitor has not submitted any artwork yet.
              </p>
            ) : null}

            {selectedSummary.aggregateStatus ? (
              <div className="rounded-lg border border-border/70 bg-muted/15 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Booth status
                </p>
                <span
                  className={cn(
                    "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    BRANDING_ARTWORK_STATUS_BADGE[selectedSummary.aggregateStatus]
                  )}
                >
                  {BRANDING_ARTWORK_STATUS_LABELS[selectedSummary.aggregateStatus]}
                </span>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Colour reflects the least-advanced item when multiple artworks are linked to this
                  booth.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}
