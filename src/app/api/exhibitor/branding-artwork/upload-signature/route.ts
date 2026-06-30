import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBrandingArtworkUploadSignature } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { canExhibitorEditArtwork } from "@/lib/branding-artwork-types";
import { isBrandingCategory } from "@/lib/item-master-catalog";
import { prisma } from "@/lib/prisma";

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

    if (!eventExhibitorId || !itemMasterId) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }

    const access = await assertExhibitorEventAccess(user, eventExhibitorId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const item = await prisma.eventItemMaster.findUnique({ where: { id: itemMasterId } });
    if (!item || !isBrandingCategory(item.category)) {
      return NextResponse.json({ error: "Invalid branding item" }, { status: 400 });
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

    const signature = createBrandingArtworkUploadSignature({ eventExhibitorId, itemMasterId });
    return NextResponse.json({ success: true, ...signature });
  } catch (error) {
    console.error("Branding upload signature failed:", error);
    const message = error instanceof Error ? error.message : "Could not prepare upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
