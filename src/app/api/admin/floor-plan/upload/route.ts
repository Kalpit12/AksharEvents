import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import {
  deletePublicAsset,
  eventFloorPlanFolder,
  uploadPublicAsset,
} from "@/lib/cloudinary-server";
import {
  FLOOR_PLAN_BOOTHS,
  FLOOR_PLAN_LAYOUT_BY_CODE,
} from "@/lib/floor-plan-layout";
import { scaleBoothLayout } from "@/lib/floor-plan-scale";
import { buildFloorPlanSvg } from "@/lib/floor-plan-svg";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg"]);
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireRole("ADMIN");
    if (!user) {
      return NextResponse.json({ error: "Event Master access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const eventId = String(formData.get("eventId") ?? "");
    const file = formData.get("file");

    if (!eventId || !(file instanceof File)) {
      return NextResponse.json({ error: "Event and floor plan image are required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Upload a PNG or JPEG floor plan image" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Floor plan image must be 15 MB or smaller" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        floorPlanImagePublicId: true,
        floorPlanSvgPublicId: true,
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = eventFloorPlanFolder(eventId);

    const imageUpload = await uploadPublicAsset(buffer, {
      folder,
      publicId: "source",
      resourceType: "image",
      overwrite: true,
    });

    const width = imageUpload.width ?? 1600;
    const height = imageUpload.height ?? 895;
    const viewBox = { width, height };

    const svgMarkup = buildFloorPlanSvg(imageUpload.url, width, height);
    const svgUpload = await uploadPublicAsset(Buffer.from(svgMarkup, "utf-8"), {
      folder,
      publicId: "interactive",
      resourceType: "image",
      format: "svg",
      overwrite: true,
    });

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          floorPlanImageUrl: imageUpload.url,
          floorPlanSvgUrl: svgUpload.url,
          floorPlanWidth: width,
          floorPlanHeight: height,
          floorPlanImagePublicId: imageUpload.publicId,
          floorPlanSvgPublicId: svgUpload.publicId,
        },
      });

      const booths = await tx.eventBooth.findMany({
        where: { eventId },
        select: { id: true, code: true },
      });

      for (const booth of booths) {
        const layout = FLOOR_PLAN_LAYOUT_BY_CODE[booth.code];
        if (!layout) continue;
        const scaled = scaleBoothLayout(layout, viewBox);
        await tx.eventBooth.update({
          where: { id: booth.id },
          data: {
            layoutX: scaled.x,
            layoutY: scaled.y,
            layoutW: scaled.w,
            layoutH: scaled.h,
          },
        });
      }

      const existingCodes = new Set(booths.map((row) => row.code));
      const missing = FLOOR_PLAN_BOOTHS.filter((booth) => !existingCodes.has(booth.code));
      if (missing.length > 0) {
        await tx.eventBooth.createMany({
          data: missing.map((booth) => {
            const scaled = scaleBoothLayout(booth, viewBox);
            return {
              eventId,
              code: booth.code,
              status: booth.defaultStatus ?? "AVAILABLE",
              layoutX: scaled.x,
              layoutY: scaled.y,
              layoutW: scaled.w,
              layoutH: scaled.h,
            };
          }),
        });
      }
    });

    const previousImageId = event.floorPlanImagePublicId;
    const previousSvgId = event.floorPlanSvgPublicId;
    if (previousImageId && previousImageId !== imageUpload.publicId) {
      try {
        await deletePublicAsset(previousImageId, "image");
      } catch {
        /* non-fatal */
      }
    }
    if (previousSvgId && previousSvgId !== svgUpload.publicId) {
      try {
        await deletePublicAsset(previousSvgId, "image");
      } catch {
        /* non-fatal */
      }
    }

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      floorPlan: {
        imageUrl: imageUpload.url,
        svgUrl: svgUpload.url,
        viewBox,
        isCustom: true,
      },
    });
  } catch (error) {
    console.error("Floor plan upload failed:", error);
    const message = error instanceof Error ? error.message : "Could not upload floor plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
