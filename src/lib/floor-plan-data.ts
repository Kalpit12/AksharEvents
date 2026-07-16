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

function emptyBoothRecord(
  layout: (typeof FLOOR_PLAN_BOOTHS)[number],
  viewBox: { width: number; height: number }
): FloorPlanBoothRecord {
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
    reservedAt: null,
    paymentVerified: false,
    paymentVerifiedAt: null,
  };
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
    reservedAt: Date | null;
    paymentVerified: boolean;
    paymentVerifiedAt: Date | null;
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
    reservedAt: row.reservedAt?.toISOString() ?? null,
    paymentVerified: row.paymentVerified,
    paymentVerifiedAt: row.paymentVerifiedAt?.toISOString() ?? null,
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

/** Seed missing booth rows and sync OCCUPIED from EventExhibitor.boothNumber. No auth. */
export async function ensureEventFloorPlanBoothsInternal(eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId },
    select: {
      id: true,
      floorPlanWidth: true,
      floorPlanHeight: true,
    },
  });
  if (!event) return { error: "Event not found" as const };

  const viewBox = resolveFloorPlanViewBox(event.floorPlanWidth, event.floorPlanHeight);

  const existing = await prisma.eventBooth.findMany({
    where: { eventId },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((row) => row.code));

  const missing = FLOOR_PLAN_BOOTHS.filter((booth) => !existingCodes.has(booth.code));
  if (missing.length > 0) {
    await prisma.eventBooth.createMany({
      data: missing.map((booth) => {
        const geometry = scaledLayoutForBoothCode(booth.code, viewBox);
        return {
          eventId,
          code: booth.code,
          status: booth.defaultStatus ?? "AVAILABLE",
          layoutX: geometry.x,
          layoutY: geometry.y,
          layoutW: geometry.w,
          layoutH: geometry.h,
        };
      }),
    });
  }

  const assigned = await prisma.eventExhibitor.findMany({
    where: { eventId, boothNumber: { not: null } },
    select: { id: true, boothNumber: true },
  });

  for (const entry of assigned) {
    const code = entry.boothNumber?.trim().toUpperCase();
    if (!code || !FLOOR_PLAN_LAYOUT_BY_CODE[code]) continue;

    const booth = await prisma.eventBooth.findUnique({
      where: { eventId_code: { eventId, code } },
    });
    if (!booth) continue;
    if (booth.eventExhibitorId && booth.eventExhibitorId !== entry.id) continue;

    if (booth.status !== "OCCUPIED" || booth.eventExhibitorId !== entry.id) {
      await prisma.eventBooth.update({
        where: { id: booth.id },
        data: {
          eventExhibitorId: entry.id,
          status: "OCCUPIED",
          paymentVerified: true,
          paymentVerifiedAt: booth.paymentVerifiedAt ?? new Date(),
        },
      });
    }
  }

  return { success: true as const };
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
    if (!row) return emptyBoothRecord(layout, viewBox);
    return serializeBooth(row, viewBox);
  });

  return { booths, floorPlan };
}

/** Public/exhibitor-safe booth view: hide other companies' contact details on non-own booths. */
export function sanitizeBoothsForExhibitor(
  booths: FloorPlanBoothRecord[],
  ownEventExhibitorId: string | null
): FloorPlanBoothRecord[] {
  return booths.map((booth) => {
    const isOwn = Boolean(ownEventExhibitorId && booth.eventExhibitorId === ownEventExhibitorId);
    if (isOwn || booth.status === "AVAILABLE" || booth.status === "PREMIUM") {
      return booth;
    }
    return {
      ...booth,
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      notes: null,
      // Keep company name so the map shows who holds reserved/occupied booths
    };
  });
}
