import type { BoothStatus } from "@prisma/client";
import {
  FLOOR_PLAN_BOOTHS,
  FLOOR_PLAN_IMAGE,
  FLOOR_PLAN_LAYOUT_BY_CODE,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import { resolveFloorPlanViewBox, scaledLayoutForBoothCode } from "@/lib/floor-plan-scale";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import { prisma } from "@/lib/prisma";

function toClientStatus(status: BoothStatus): BoothStatusValue {
  return status as BoothStatusValue;
}

function serializeBooth(
  row: {
    id: string;
    code: string;
    status: BoothStatus;
    eventExhibitorId: string | null;
    companyName: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    notes: string | null;
    layoutX: number | null;
    layoutY: number | null;
    layoutW: number | null;
    layoutH: number | null;
    eventExhibitor: { exhibitor: { companyName: string } } | null;
  },
  viewBox: { width: number; height: number }
): FloorPlanBoothRecord {
  const layout = FLOOR_PLAN_LAYOUT_BY_CODE[row.code];
  const geometry = scaledLayoutForBoothCode(row.code, viewBox, row);
  return {
    id: row.id,
    code: row.code,
    standType: layout?.standType ?? "A",
    x: geometry.x,
    y: geometry.y,
    w: geometry.w,
    h: geometry.h,
    status: toClientStatus(row.status),
    eventExhibitorId: row.eventExhibitorId,
    exhibitorName: row.eventExhibitor?.exhibitor.companyName ?? null,
    companyName: row.companyName,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    notes: row.notes,
  };
}

export function buildFloorPlanConfig(event: {
  floorPlanImageUrl: string | null;
  floorPlanSvgUrl: string | null;
  floorPlanWidth: number | null;
  floorPlanHeight: number | null;
}): EventFloorPlanConfig {
  const viewBox = resolveFloorPlanViewBox(event.floorPlanWidth, event.floorPlanHeight);
  const isCustom = Boolean(event.floorPlanImageUrl);

  return {
    imageUrl: event.floorPlanImageUrl ?? FLOOR_PLAN_IMAGE,
    svgUrl: event.floorPlanSvgUrl,
    viewBox,
    isCustom,
  };
}

export async function loadEventFloorPlanBooths(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      floorPlanImageUrl: true,
      floorPlanSvgUrl: true,
      floorPlanWidth: true,
      floorPlanHeight: true,
    },
  });
  if (!event) return null;

  const floorPlan = buildFloorPlanConfig(event);
  const viewBox = floorPlan.viewBox;

  const rows = await prisma.eventBooth.findMany({
    where: { eventId },
    include: {
      eventExhibitor: {
        include: { exhibitor: { select: { companyName: true } } },
      },
    },
    orderBy: { code: "asc" },
  });

  const byCode = new Map(rows.map((row) => [row.code, row]));
  const booths = FLOOR_PLAN_BOOTHS.map((layout) => {
    const row = byCode.get(layout.code);
    if (!row) {
      const geometry = scaledLayoutForBoothCode(layout.code, viewBox);
      return {
        id: layout.code,
        code: layout.code,
        standType: layout.standType,
        x: geometry.x,
        y: geometry.y,
        w: geometry.w,
        h: geometry.h,
        status: (layout.defaultStatus ?? "AVAILABLE") as BoothStatusValue,
        eventExhibitorId: null,
        exhibitorName: null,
        companyName: null,
        contactName: null,
        contactPhone: null,
        contactEmail: null,
        notes: null,
      } satisfies FloorPlanBoothRecord;
    }
    return serializeBooth(row, viewBox);
  });

  return { booths, floorPlan };
}
