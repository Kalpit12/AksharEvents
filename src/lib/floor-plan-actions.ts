"use server";

import { revalidatePath } from "next/cache";
import type { BoothStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import {
  ensureEventFloorPlanBoothsInternal,
  loadEventFloorPlanBooths,
} from "@/lib/floor-plan-data";
import {
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

function defaultStatusForCode(code: string): BoothStatus {
  return (FLOOR_PLAN_LAYOUT_BY_CODE[code]?.defaultStatus ?? "AVAILABLE") as BoothStatus;
}

export async function ensureEventFloorPlanBooths(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  return ensureEventFloorPlanBoothsInternal(eventId);
}

export async function getEventFloorPlanBooths(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) {
    return { error: auth.error, booths: null as FloorPlanBoothRecord[] | null, floorPlan: null };
  }

  await ensureEventFloorPlanBoothsInternal(eventId);

  const snapshot = await loadEventFloorPlanBooths(eventId);
  if (!snapshot) {
    return { error: "Event not found", booths: null, floorPlan: null };
  }

  return { booths: snapshot.booths, floorPlan: snapshot.floorPlan, error: null };
}

/**
 * Save booth details. Linking an exhibitor without allocate=true keeps RESERVED
 * (payment pending). Pass allocate: true after payment verification to OCCUPIED.
 */
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
  /** When true with an exhibitor linked, allocate (OCCUPIED + boothNumber). Requires paymentVerified unless forceAllocate. */
  allocate?: boolean;
  forceAllocate?: boolean;
}) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const code = input.boothCode.trim().toUpperCase();
  if (!FLOOR_PLAN_LAYOUT_BY_CODE[code]) return { error: "Unknown booth code" };

  await ensureEventFloorPlanBoothsInternal(input.eventId);

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

  const allocate = Boolean(input.allocate);
  let status: BoothStatus = input.status as BoothStatus;

  if (exhibitorId && allocate) {
    if (!booth.paymentVerified && !input.forceAllocate) {
      return {
        error:
          "Verify payment before allocating this booth. Use “Verify payment” first, or force allocate if needed.",
      };
    }
    status = "OCCUPIED";
  } else if (exhibitorId && !allocate) {
    if (status === "OCCUPIED" || status === "AVAILABLE" || status === "PREMIUM") {
      status = "RESERVED";
    }
  } else if (!exhibitorId && status === "OCCUPIED") {
    status = defaultStatusForCode(code);
  }

  try {
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
              status: defaultStatusForCode(previousBooth.code),
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

        await tx.eventExhibitor.update({
          where: { id: exhibitorId },
          data: { boothNumber: allocate ? code : null },
        });
      }

      if (booth.eventExhibitorId && booth.eventExhibitorId !== exhibitorId) {
        await tx.eventExhibitor.update({
          where: { id: booth.eventExhibitorId },
          data: { boothNumber: null },
        });
      }

      const clearing = !exhibitorId;

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
          reservedAt:
            exhibitorId && status === "RESERVED"
              ? (booth.reservedAt ?? new Date())
              : exhibitorId
                ? booth.reservedAt
                : null,
          paymentVerified: clearing ? false : booth.paymentVerified,
          paymentVerifiedAt: clearing ? null : booth.paymentVerifiedAt,
          paymentVerifiedBy: clearing ? null : booth.paymentVerifiedBy,
        },
      });

      if (!exhibitorId && booth.eventExhibitorId) {
        await tx.eventExhibitor.update({
          where: { id: booth.eventExhibitorId },
          data: { boothNumber: null },
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save booth";
    if (message.includes("Unique constraint") || message.includes("eventExhibitorId")) {
      return { error: "This exhibitor already has another booth reserved or allocated." };
    }
    return { error: message };
  }

  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  return { success: true as const, status };
}

export async function verifyBoothPayment(input: {
  eventId: string;
  boothCode: string;
}) {
  const auth = await requireEventMaster();
  if (auth.error || !auth.user) return { error: auth.error ?? "Event Master access required" };

  const code = input.boothCode.trim().toUpperCase();
  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: input.eventId, code } },
  });
  if (!booth) return { error: "Booth not found" };
  if (!booth.eventExhibitorId) {
    return { error: "Link or wait for an exhibitor reservation before verifying payment." };
  }
  if (booth.status !== "RESERVED" && booth.status !== "OCCUPIED") {
    return { error: "Only reserved or occupied booths can have payment verified." };
  }

  await prisma.eventBooth.update({
    where: { id: booth.id },
    data: {
      paymentVerified: true,
      paymentVerifiedAt: new Date(),
      paymentVerifiedBy: auth.user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  return { success: true as const };
}

export async function allocateBoothToExhibitor(input: {
  eventId: string;
  boothCode: string;
  forceAllocate?: boolean;
}) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const code = input.boothCode.trim().toUpperCase();
  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: input.eventId, code } },
    include: {
      eventExhibitor: {
        include: { exhibitor: true },
      },
    },
  });
  if (!booth) return { error: "Booth not found" };
  if (!booth.eventExhibitorId || !booth.eventExhibitor) {
    return { error: "No exhibitor reservation on this booth to allocate." };
  }
  if (!booth.paymentVerified && !input.forceAllocate) {
    return { error: "Verify payment before allocating this booth." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventExhibitor.update({
      where: { id: booth.eventExhibitorId! },
      data: { boothNumber: code },
    });
    await tx.eventBooth.update({
      where: { id: booth.id },
      data: {
        status: "OCCUPIED",
        paymentVerified: true,
        paymentVerifiedAt: booth.paymentVerifiedAt ?? new Date(),
        companyName: booth.companyName ?? booth.eventExhibitor!.exhibitor.companyName,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  return { success: true as const };
}

export async function releaseBoothReservation(input: {
  eventId: string;
  boothCode: string;
}) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const code = input.boothCode.trim().toUpperCase();
  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: input.eventId, code } },
  });
  if (!booth) return { error: "Booth not found" };

  await prisma.$transaction(async (tx) => {
    if (booth.eventExhibitorId) {
      await tx.eventExhibitor.update({
        where: { id: booth.eventExhibitorId },
        data: { boothNumber: null },
      });
    }
    await tx.eventBooth.update({
      where: { id: booth.id },
      data: {
        status: defaultStatusForCode(code),
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
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  return { success: true as const };
}
