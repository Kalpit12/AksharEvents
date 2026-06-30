"use server";

import type { BrandingArtworkStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { requirePrintingStaff } from "@/lib/printing-access";
import {
  canExhibitorEditArtwork,
  printingStaffActionsFor,
  serializeBrandingArtworkSubmission,
} from "@/lib/branding-artwork-types";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { isBrandingCategory } from "@/lib/item-master-catalog";
import { deleteAuthenticatedDocument } from "@/lib/cloudinary-server";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

async function assertPrintingStaff() {
  const user = await requirePrintingStaff();
  if (!user) return { error: "Unauthorized" as const, user: null };
  return { user, error: null };
}

export async function submitBrandingArtwork(eventExhibitorId: string, itemMasterIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const access = await assertExhibitorEventAccess(user, eventExhibitorId);
  if (!access.ok) return { error: access.error };

  if (itemMasterIds.length === 0) {
    return { error: "No branding items selected" };
  }

  const submissions = await prisma.brandingArtworkSubmission.findMany({
    where: {
      eventExhibitorId,
      itemMasterId: { in: itemMasterIds },
    },
    include: { itemMaster: true },
  });

  if (submissions.length !== itemMasterIds.length) {
    return { error: "One or more branding items were not found" };
  }

  const missingUpload = itemMasterIds.filter((id) => {
    const row = submissions.find((s) => s.itemMasterId === id);
    return !row?.cloudinaryPublicId;
  });
  if (missingUpload.length > 0) {
    return { error: "Upload artwork before submitting this item" };
  }

  const notEditable = submissions.filter((s) => !canExhibitorEditArtwork(s.status));
  if (notEditable.length > 0) {
    return { error: "This artwork has already been submitted and cannot be changed" };
  }

  const now = new Date();
  await prisma.$transaction(
    submissions
      .filter((s) => canExhibitorEditArtwork(s.status) && s.cloudinaryPublicId)
      .map((submission) =>
        prisma.brandingArtworkSubmission.update({
          where: { id: submission.id },
          data: {
            status: "SUBMITTED",
            submittedAt: now,
            rejectionReason: null,
          },
        })
      )
  );

  try {
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "BrandingArtworkSubmission",
      entityId: eventExhibitorId,
      details: { itemMasterIds, action: "submit" },
    });
  } catch {
    /* non-blocking */
  }

  revalidatePath("/exhibitor");
  revalidatePath("/printing");
  revalidatePath("/admin/printing");

  const updated = await prisma.brandingArtworkSubmission.findMany({
    where: { eventExhibitorId, itemMasterId: { in: itemMasterIds } },
    include: { itemMaster: true },
  });

  return {
    success: true,
    submissions: updated.map(serializeBrandingArtworkSubmission),
  };
}

export async function updateBrandingArtworkStatus(input: {
  submissionId: string;
  action: "verify" | "reject" | "advance";
  rejectionReason?: string;
}) {
  const staff = await assertPrintingStaff();
  if (staff.error) return { error: staff.error };

  const submission = await prisma.brandingArtworkSubmission.findUnique({
    where: { id: input.submissionId },
    include: { itemMaster: true },
  });
  if (!submission) return { error: "Submission not found" };

  const actions = printingStaffActionsFor(submission.status);

  if (input.action === "verify") {
    if (!actions.canVerify) return { error: "Cannot verify artwork in its current status" };
    await prisma.brandingArtworkSubmission.update({
      where: { id: submission.id },
      data: {
        status: "VERIFIED",
        rejectionReason: null,
        statusUpdatedById: staff.user!.id,
      },
    });
  } else if (input.action === "reject") {
    if (!actions.canReject) return { error: "Cannot reject artwork in its current status" };
    const reason = input.rejectionReason?.trim();
    if (!reason) return { error: "Please provide a reason why the artwork was not verified" };
    await prisma.brandingArtworkSubmission.update({
      where: { id: submission.id },
      data: {
        status: "NOT_VERIFIED",
        rejectionReason: reason,
        statusUpdatedById: staff.user!.id,
      },
    });
  } else if (input.action === "advance") {
    if (!actions.canAdvance || !actions.nextStatus) {
      return { error: "No further status available for this artwork" };
    }
    await prisma.brandingArtworkSubmission.update({
      where: { id: submission.id },
      data: {
        status: actions.nextStatus as BrandingArtworkStatus,
        statusUpdatedById: staff.user!.id,
      },
    });
  } else {
    return { error: "Invalid action" };
  }

  try {
    await createAuditLog({
      userId: staff.user!.id,
      action: "UPDATE",
      entity: "BrandingArtworkSubmission",
      entityId: submission.id,
      details: { action: input.action, from: submission.status },
    });
  } catch {
    /* non-blocking */
  }

  revalidatePath("/printing");
  revalidatePath("/admin/printing");
  revalidatePath("/exhibitor");

  const updated = await prisma.brandingArtworkSubmission.findUnique({
    where: { id: submission.id },
    include: { itemMaster: true },
  });

  return {
    success: true,
    submission: updated ? serializeBrandingArtworkSubmission(updated) : null,
  };
}

export async function ensureBrandingSubmissionRows(
  eventExhibitorId: string,
  itemMasterIds: string[]
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const access = await assertExhibitorEventAccess(user, eventExhibitorId);
  if (!access.ok) return { error: access.error };

  const items = await prisma.eventItemMaster.findMany({
    where: { id: { in: itemMasterIds } },
  });

  const brandingItems = items.filter((item) => isBrandingCategory(item.category));
  if (brandingItems.length === 0) return { success: true, submissions: [] };

  await Promise.all(
    brandingItems.map((item) =>
      prisma.brandingArtworkSubmission.upsert({
        where: {
          eventExhibitorId_itemMasterId: {
            eventExhibitorId,
            itemMasterId: item.id,
          },
        },
        create: {
          eventExhibitorId,
          itemMasterId: item.id,
          uploadedById: user.id,
        },
        update: {},
      })
    )
  );

  const rows = await prisma.brandingArtworkSubmission.findMany({
    where: {
      eventExhibitorId,
      itemMasterId: { in: brandingItems.map((i) => i.id) },
    },
    include: { itemMaster: true },
    orderBy: { itemMaster: { name: "asc" } },
  });

  return {
    success: true,
    submissions: rows.map(serializeBrandingArtworkSubmission),
  };
}

export async function removeBrandingArtworkItem(
  eventExhibitorId: string,
  itemMasterId: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const access = await assertExhibitorEventAccess(user, eventExhibitorId);
  if (!access.ok) return { error: access.error };

  const item = await prisma.eventItemMaster.findUnique({ where: { id: itemMasterId } });
  if (!item || !isBrandingCategory(item.category)) {
    return { error: "Invalid branding item" };
  }

  const submission = await prisma.brandingArtworkSubmission.findUnique({
    where: {
      eventExhibitorId_itemMasterId: { eventExhibitorId, itemMasterId },
    },
  });

  if (submission && !canExhibitorEditArtwork(submission.status)) {
    return { error: "Submitted artwork cannot be removed. Contact the event team for help." };
  }

  if (submission?.cloudinaryPublicId) {
    try {
      await deleteAuthenticatedDocument(submission.cloudinaryPublicId);
    } catch {
      /* continue — DB row still removed */
    }
  }

  if (submission) {
    await prisma.brandingArtworkSubmission.delete({ where: { id: submission.id } });
  }

  const registration = await prisma.exhibitorRegistration.findUnique({
    where: { eventExhibitorId },
  });
  if (registration?.formData && typeof registration.formData === "object") {
    const formData = registration.formData as SavedRegistrationData;
    const currentIds =
      formData.selectedAdditionalItemIds ?? formData.selectedEquipmentIds ?? [];
    const nextIds = currentIds.filter((id) => id !== itemMasterId);
    if (nextIds.length !== currentIds.length) {
      await prisma.exhibitorRegistration.update({
        where: { eventExhibitorId },
        data: {
          formData: {
            ...formData,
            selectedAdditionalItemIds: nextIds,
          },
        },
      });
    }
  }

  try {
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "BrandingArtworkSubmission",
      entityId: submission?.id ?? itemMasterId,
      details: { eventExhibitorId, itemMasterId },
    });
  } catch {
    /* non-blocking */
  }

  revalidatePath("/exhibitor");
  revalidatePath("/printing");

  return { success: true };
}
