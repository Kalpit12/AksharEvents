"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import {
  ensureEventFloorPlanBoothsInternal,
  loadEventFloorPlanBooths,
  sanitizeBoothsForExhibitor,
} from "@/lib/floor-plan-data";
import { FLOOR_PLAN_LAYOUT_BY_CODE } from "@/lib/floor-plan-layout";
import { resolveExhibitorBoothPhase } from "@/lib/booth-allocation";
import type {
  EventFloorPlanConfig,
  ExhibitorBoothPhase,
  FloorPlanBoothRecord,
} from "@/lib/floor-plan-types";
import { prisma } from "@/lib/prisma";

function defaultStatusForCode(code: string) {
  return FLOOR_PLAN_LAYOUT_BY_CODE[code]?.defaultStatus ?? "AVAILABLE";
}

async function resolveExhibitorEventContext(eventExhibitorId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in required" as const };

  const access = await requireExhibitorAccess(user.id);
  if (!access) return { error: "Exhibitor access required" as const };

  const eventExhibitor = await prisma.eventExhibitor.findUnique({
    where: { id: eventExhibitorId },
    include: {
      exhibitor: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
    },
  });

  if (!eventExhibitor || eventExhibitor.exhibitorId !== access.exhibitor.id) {
    return { error: "Event registration not found" as const };
  }

  return { user, access, eventExhibitor };
}

export async function getExhibitorFloorPlan(eventExhibitorId: string): Promise<
  | {
      booths: FloorPlanBoothRecord[];
      floorPlan: EventFloorPlanConfig;
      phase: ExhibitorBoothPhase;
      ownBoothCode: string | null;
      error?: undefined;
    }
  | {
      booths: null;
      floorPlan: null;
      phase: ExhibitorBoothPhase;
      ownBoothCode: null;
      error: string;
    }
> {
  const ctx = await resolveExhibitorEventContext(eventExhibitorId);
  if ("error" in ctx && ctx.error) {
    return {
      booths: null,
      floorPlan: null,
      phase: "none",
      ownBoothCode: null,
      error: ctx.error,
    };
  }

  const { eventExhibitor } = ctx;
  await ensureEventFloorPlanBoothsInternal(eventExhibitor.eventId);

  const snapshot = await loadEventFloorPlanBooths(eventExhibitor.eventId);
  if (!snapshot) {
    return {
      booths: null,
      floorPlan: null,
      phase: "none",
      ownBoothCode: null,
      error: "Event not found",
    };
  }

  const ownBooth =
    snapshot.booths.find((b) => b.eventExhibitorId === eventExhibitorId) ?? null;
  const allocatedCode = eventExhibitor.boothNumber?.trim().toUpperCase() ?? null;

  const { phase, boothNumber, boothReservedCode } = resolveExhibitorBoothPhase({
    allocatedBoothNumber: allocatedCode,
    linkedBooth: ownBooth
      ? {
          code: ownBooth.code,
          status: ownBooth.status,
          paymentVerified: ownBooth.paymentVerified,
        }
      : null,
  });

  return {
    booths: sanitizeBoothsForExhibitor(snapshot.booths, eventExhibitorId),
    floorPlan: snapshot.floorPlan,
    phase,
    ownBoothCode: boothNumber ?? boothReservedCode,
  };
}

export async function requestExhibitorBooth(input: {
  eventExhibitorId: string;
  boothCode: string;
}) {
  const ctx = await resolveExhibitorEventContext(input.eventExhibitorId);
  if ("error" in ctx && ctx.error) return { error: ctx.error };

  const { eventExhibitor } = ctx;
  const code = input.boothCode.trim().toUpperCase();
  if (!FLOOR_PLAN_LAYOUT_BY_CODE[code]) return { error: "Unknown booth code" };

  if (eventExhibitor.boothNumber) {
    return {
      error: `Booth ${eventExhibitor.boothNumber} is already allocated to your company. Contact Event Master to change it.`,
    };
  }

  await ensureEventFloorPlanBoothsInternal(eventExhibitor.eventId);

  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: eventExhibitor.eventId, code } },
  });
  if (!booth) return { error: "Booth not found" };

  if (booth.status === "OCCUPIED") {
    return { error: "This booth is already allocated to another company." };
  }
  if (
    booth.status === "RESERVED" &&
    booth.eventExhibitorId &&
    booth.eventExhibitorId !== eventExhibitor.id
  ) {
    return { error: "This booth is already reserved by another exhibitor." };
  }
  if (booth.status !== "AVAILABLE" && booth.status !== "PREMIUM" && booth.eventExhibitorId !== eventExhibitor.id) {
    return { error: "This booth is not available for selection." };
  }

  const existingReservation = await prisma.eventBooth.findFirst({
    where: {
      eventId: eventExhibitor.eventId,
      eventExhibitorId: eventExhibitor.id,
      NOT: { id: booth.id },
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      if (existingReservation) {
        await tx.eventBooth.update({
          where: { id: existingReservation.id },
          data: {
            eventExhibitorId: null,
            status: defaultStatusForCode(existingReservation.code),
            companyName: null,
            contactName: null,
            contactPhone: null,
            contactEmail: null,
            reservedAt: null,
            paymentVerified: false,
            paymentVerifiedAt: null,
            paymentVerifiedBy: null,
          },
        });
      }

      await tx.eventBooth.update({
        where: { id: booth.id },
        data: {
          status: "RESERVED",
          eventExhibitorId: eventExhibitor.id,
          companyName: eventExhibitor.exhibitor.companyName,
          contactName: eventExhibitor.exhibitor.contactName,
          contactPhone: eventExhibitor.exhibitor.contactPhone,
          contactEmail: eventExhibitor.exhibitor.contactEmail,
          reservedAt: new Date(),
          paymentVerified: false,
          paymentVerifiedAt: null,
          paymentVerifiedBy: null,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reserve booth";
    if (message.includes("Unique constraint")) {
      return { error: "You already have a booth reservation. Cancel it first or wait for allocation." };
    }
    return { error: message };
  }

  revalidatePath("/exhibitor", "layout");
  revalidatePath("/admin");
  return { success: true as const, boothCode: code };
}

export async function cancelExhibitorBoothRequest(input: { eventExhibitorId: string }) {
  const ctx = await resolveExhibitorEventContext(input.eventExhibitorId);
  if ("error" in ctx && ctx.error) return { error: ctx.error };

  const { eventExhibitor } = ctx;

  if (eventExhibitor.boothNumber) {
    return {
      error: "Your booth is already allocated. Contact Event Master to release it.",
    };
  }

  const booth = await prisma.eventBooth.findFirst({
    where: {
      eventId: eventExhibitor.eventId,
      eventExhibitorId: eventExhibitor.id,
      status: "RESERVED",
    },
  });
  if (!booth) return { error: "No active booth reservation to cancel." };

  await prisma.eventBooth.update({
    where: { id: booth.id },
    data: {
      status: defaultStatusForCode(booth.code),
      eventExhibitorId: null,
      companyName: null,
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      reservedAt: null,
      paymentVerified: false,
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
    },
  });

  revalidatePath("/exhibitor", "layout");
  revalidatePath("/admin");
  return { success: true as const };
}
