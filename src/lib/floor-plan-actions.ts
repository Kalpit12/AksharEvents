"use server";

import { revalidatePath } from "next/cache";
import type { BoothStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { loadEventFloorPlanBooths } from "@/lib/floor-plan-data";
import {
  FLOOR_PLAN_BOOTHS,
  FLOOR_PLAN_LAYOUT_BY_CODE,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import { resolveFloorPlanViewBox, scaledLayoutForBoothCode } from "@/lib/floor-plan-scale";
import type { FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import { prisma } from "@/lib/prisma";

async function requireEventMaster() {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" as const, user: null };
  return { user, error: null };
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

export async function ensureEventFloorPlanBooths(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    select: {
      id: true,
      floorPlanWidth: true,
      floorPlanHeight: true,
    },
  });
  if (!event) return { error: "Event not found" };

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
  if (auth.error) {
    return { error: auth.error, booths: null as FloorPlanBoothRecord[] | null, floorPlan: null };
  }

  await ensureEventFloorPlanBooths(eventId);

  const snapshot = await loadEventFloorPlanBooths(eventId);
  if (!snapshot) {
    return { error: "Event not found", booths: null, floorPlan: null };
  }

  return { booths: snapshot.booths, floorPlan: snapshot.floorPlan, error: null };
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
