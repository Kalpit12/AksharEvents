import type { BrandingArtworkStatus } from "@prisma/client";
import {
  aggregateArtworkStatus,
  BRANDING_ARTWORK_STATUS_FILL,
  PRINTING_FLOOR_PLAN_NO_ARTWORK_FILL,
  PRINTING_FLOOR_PLAN_UNASSIGNED_FILL,
  type AdminBrandingArtworkRecord,
} from "@/lib/branding-artwork-types";
import { FLOOR_PLAN_LAYOUT_BY_CODE } from "@/lib/floor-plan-layout";
import type { FloorPlanBoothRecord } from "@/lib/floor-plan-types";

export type BoothArtworkSummary = {
  boothCode: string;
  companyName: string | null;
  eventExhibitorId: string | null;
  submissions: AdminBrandingArtworkRecord[];
  aggregateStatus: BrandingArtworkStatus | null;
  fillColor: string;
};

export function normalizeBoothCode(value: string | null | undefined) {
  let code = value?.trim().toUpperCase() ?? "";
  code = code.replace(/^BOOTH\s*/i, "").trim();
  return code;
}

function normalizeCompanyName(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function artworkMatchesBooth(
  booth: FloorPlanBoothRecord,
  record: AdminBrandingArtworkRecord
) {
  const boothCode = normalizeBoothCode(booth.code);
  const recordBooth = normalizeBoothCode(record.boothNumber);

  if (booth.eventExhibitorId && record.eventExhibitorId === booth.eventExhibitorId) {
    return true;
  }

  if (recordBooth && recordBooth === boothCode && FLOOR_PLAN_LAYOUT_BY_CODE[boothCode]) {
    return true;
  }

  const boothCompany = normalizeCompanyName(booth.companyName ?? booth.exhibitorName);
  const recordCompany = normalizeCompanyName(record.companyName);
  if (boothCompany && boothCompany === recordCompany) {
    return true;
  }

  return false;
}

function dedupeSubmissions(rows: AdminBrandingArtworkRecord[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function buildBoothArtworkSummaries(
  booths: FloorPlanBoothRecord[],
  records: AdminBrandingArtworkRecord[]
): BoothArtworkSummary[] {
  return booths.map((booth) => {
    const submissions = dedupeSubmissions(records.filter((record) => artworkMatchesBooth(booth, record)));

    const companyName =
      submissions[0]?.companyName ??
      booth.companyName ??
      booth.exhibitorName ??
      null;

    const eventExhibitorId =
      booth.eventExhibitorId ?? submissions[0]?.eventExhibitorId ?? null;

    const aggregateStatus = aggregateArtworkStatus(submissions.map((row) => row.status));

    let fillColor = PRINTING_FLOOR_PLAN_UNASSIGNED_FILL;
    if (companyName || eventExhibitorId || submissions.length > 0) {
      fillColor = aggregateStatus
        ? BRANDING_ARTWORK_STATUS_FILL[aggregateStatus]
        : PRINTING_FLOOR_PLAN_NO_ARTWORK_FILL;
    }

    return {
      boothCode: booth.code,
      companyName,
      eventExhibitorId,
      submissions,
      aggregateStatus,
      fillColor,
    };
  });
}

export function findUnmappedArtworkRecords(
  summaries: BoothArtworkSummary[],
  records: AdminBrandingArtworkRecord[]
) {
  const mappedIds = new Set(summaries.flatMap((summary) => summary.submissions.map((row) => row.id)));
  return records.filter((record) => !mappedIds.has(record.id));
}
