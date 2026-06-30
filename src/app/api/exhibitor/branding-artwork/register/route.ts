import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { brandingArtworkFolder } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import {
  ALLOWED_BRANDING_MIME_TYPES,
  MAX_BRANDING_ARTWORK_BYTES,
  canExhibitorEditArtwork,
  parseCloudinaryResourceType,
  serializeBrandingArtworkSubmission,
} from "@/lib/branding-artwork-types";
import { isBrandingCategory } from "@/lib/item-master-catalog";
import { recordBrandingStatusHistory } from "@/lib/branding-artwork-history";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventExhibitorId = String(body.eventExhibitorId ?? "");
    const itemMasterId = String(body.itemMasterId ?? "");
    const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "");
    const originalFileName = String(body.originalFileName ?? "");
    const mimeType = String(body.mimeType ?? "");
    const fileSize = Number(body.fileSize ?? 0);
    const cloudinaryResourceType = parseCloudinaryResourceType(
      typeof body.cloudinaryResourceType === "string" ? body.cloudinaryResourceType : null
    );

    if (!eventExhibitorId || !itemMasterId) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }
    if (!cloudinaryPublicId || !originalFileName) {
      return NextResponse.json({ error: "Missing Cloudinary upload details" }, { status: 400 });
    }
    if (!ALLOWED_BRANDING_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Only PDF, JPG, PNG, WEBP, SVG, or AI/EPS files are allowed" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_BRANDING_ARTWORK_BYTES) {
      return NextResponse.json({ error: "File must be 25 MB or smaller" }, { status: 400 });
    }

    const access = await assertExhibitorEventAccess(user, eventExhibitorId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const item = await prisma.eventItemMaster.findUnique({ where: { id: itemMasterId } });
    if (!item || !isBrandingCategory(item.category)) {
      return NextResponse.json({ error: "Invalid branding item" }, { status: 400 });
    }

    const expectedFolder = brandingArtworkFolder(eventExhibitorId, itemMasterId);
    if (
      cloudinaryPublicId.includes("..") ||
      !cloudinaryPublicId.startsWith(`${expectedFolder}/`)
    ) {
      return NextResponse.json({ error: "Invalid artwork reference" }, { status: 400 });
    }

    const existing = await prisma.brandingArtworkSubmission.findUnique({
      where: {
        eventExhibitorId_itemMasterId: { eventExhibitorId, itemMasterId },
      },
    });
    if (existing && !canExhibitorEditArtwork(existing.status)) {
      return NextResponse.json(
        { error: "Artwork has been submitted and cannot be changed" },
        { status: 400 }
      );
    }

    const submission = await prisma.$transaction(async (tx) => {
      const row = await tx.brandingArtworkSubmission.upsert({
        where: {
          eventExhibitorId_itemMasterId: { eventExhibitorId, itemMasterId },
        },
        create: {
          eventExhibitorId,
          itemMasterId,
          cloudinaryPublicId,
          cloudinaryResourceType,
          originalFileName,
          mimeType,
          fileSize,
          uploadedById: user.id,
          status: "DRAFT",
        },
        update: {
          cloudinaryPublicId,
          cloudinaryResourceType,
          originalFileName,
          mimeType,
          fileSize,
          uploadedById: user.id,
          status: "DRAFT",
        },
        include: { itemMaster: true },
      });

      if (existing && existing.status !== "DRAFT") {
        await recordBrandingStatusHistory(tx, {
          submissionId: row.id,
          status: "DRAFT",
          note: "Corrected artwork uploaded",
          changedById: user.id,
        });
      }

      return row;
    });

    try {
      await createAuditLog({
        userId: user.id,
        action: existing ? "UPDATE" : "CREATE",
        entity: "BrandingArtworkSubmission",
        entityId: submission.id,
        details: { eventExhibitorId, itemMasterId },
      });
    } catch {
      /* non-blocking */
    }

    return NextResponse.json({
      success: true,
      submission: serializeBrandingArtworkSubmission(submission),
    });
  } catch (error) {
    console.error("Branding artwork register failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
