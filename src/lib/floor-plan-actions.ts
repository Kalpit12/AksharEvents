"use server";

import { revalidatePath } from "next/cache";
import type { BoothStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import {
  FLOOR_PLAN_BOOTHS,
  FLOOR_PLAN_LAYOUT_BY_CODE,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import type { FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import { prisma } from "@/lib/prisma";

async function requireEventMaster() {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" as const, user: null };
  return { user, error: null };
}

function toClientStatus(status: BoothStatus): BoothStatusValue {
  return status as BoothStatusValue;
}

async function resolveEventExhibitorForBooth(
  eventId: string,
  eventExhibitorId: string | null,
  companyName: string | null
) {
  if (eventExhibitorId) return eventExhibitorId;
  const name = companyName?.trim();
  if (!name) return null;

  const entry = await prisma.eventExhibitor.findFirst({
    where: {
      eventId,
      exhibitor: { companyName: { equals: name, mode: "insensitive" } },
    },
    select: { id: true },
  });
  return entry?.id ?? null;
}

function serializeBooth(row: {
  id: string;
  code: string;
  status: BoothStatus;
  eventExhibitorId: string | null;
  companyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  eventExhibitor: { exhibitor: { companyName: string } } | null;
}): FloorPlanBoothRecord {
  const layout = FLOOR_PLAN_LAYOUT_BY_CODE[row.code];
  return {
    id: row.id,
    code: row.code,
    standType: layout?.standType ?? "A",
    x: layout?.x ?? 0,
    y: layout?.y ?? 0,
    w: layout?.w ?? 0,
    h: layout?.h ?? 0,
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

export async function ensureEventFloorPlanBooths(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const event = await prisma.event.findFirst({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  const existing = await prisma.eventBooth.findMany({
    where: { eventId },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((row) => row.code));

  const missing = FLOOR_PLAN_BOOTHS.filter((booth) => !existingCodes.has(booth.code));
  if (missing.length > 0) {
    await prisma.eventBooth.createMany({
      data: missing.map((booth) => ({
        eventId,
        code: booth.code,
        status: booth.defaultStatus ?? "AVAILABLE",
      })),
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
    if (!booth || booth.eventExhibitorId === entry.id) continue;

    if (booth.eventExhibitorId && booth.eventExhibitorId !== entry.id) continue;

    await prisma.eventBooth.update({
      where: { id: booth.id },
      data: { eventExhibitorId: entry.id, status: "OCCUPIED" },
    });
  }

  return { success: true as const };
}

export async function getEventFloorPlanBooths(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error, booths: null as FloorPlanBoothRecord[] | null };

  await ensureEventFloorPlanBooths(eventId);

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
      return {
        id: layout.code,
        code: layout.code,
        standType: layout.standType,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
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
    return serializeBooth(row);
  });

  return { booths, error: null };
}

export async function updateEventBooth(input: {
  eventId: string;
  boothCode: string;
  status: BoothStatusValue;
  eventExhibitorId: string | null;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
}) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const code = input.boothCode.trim().toUpperCase();
  if (!FLOOR_PLAN_LAYOUT_BY_CODE[code]) return { error: "Unknown booth code" };

  await ensureEventFloorPlanBooths(input.eventId);

  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: input.eventId, code } },
  });
  if (!booth) return { error: "Booth not found" };

  const notes = input.notes.trim() || null;
  const companyName = input.companyName.trim() || null;
  const contactName = input.contactName.trim() || null;
  const contactPhone = input.contactPhone.trim() || null;
  const contactEmail = input.contactEmail.trim() || null;
  const exhibitorId = await resolveEventExhibitorForBooth(
    input.eventId,
    input.eventExhibitorId || null,
    companyName
  );
  let status: BoothStatus = input.status as BoothStatus;

  if (exhibitorId) {
    status = "OCCUPIED";
  } else if (status === "OCCUPIED") {
    status = "AVAILABLE";
  }

  await prisma.$transaction(async (tx) => {
    if (exhibitorId) {
      const previousBooth = await tx.eventBooth.findFirst({
        where: { eventId: input.eventId, eventExhibitorId: exhibitorId, NOT: { id: booth.id } },
      });
      if (previousBooth) {
        await tx.eventBooth.update({
          where: { id: previousBooth.id },
          data: {
            eventExhibitorId: null,
            status: "AVAILABLE",
            companyName: null,
            contactName: null,
            contactPhone: null,
            contactEmail: null,
          },
        });
      }

      await tx.eventExhibitor.update({
        where: { id: exhibitorId },
        data: { boothNumber: code },
      });
    }

    if (booth.eventExhibitorId && booth.eventExhibitorId !== exhibitorId) {
      await tx.eventExhibitor.update({
        where: { id: booth.eventExhibitorId },
        data: { boothNumber: null },
      });
    }

    await tx.eventBooth.update({
      where: { id: booth.id },
      data: {
        status,
        notes,
        companyName,
        contactName,
        contactPhone,
        contactEmail,
        eventExhibitorId: exhibitorId,
      },
    });

    if (!exhibitorId && booth.eventExhibitorId) {
      await tx.eventExhibitor.update({
        where: { id: booth.eventExhibitorId },
        data: { boothNumber: null },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true as const };
}
