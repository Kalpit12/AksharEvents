import { serializeBrandingArtworkSubmission, type AdminBrandingArtworkRecord } from "@/lib/branding-artwork-types";
import { serializeBrandingStatusHistory } from "@/lib/branding-artwork-history";
import { loadEventFloorPlanBooths } from "@/lib/floor-plan-data";
import { isBrandingCategory } from "@/lib/item-master-catalog";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import type { BrandingItemOption } from "@/lib/printing-floor-plan-matching";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma, withDbRetry } from "@/lib/prisma";

export type PrintingDashboardPageData = {
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  records: AdminBrandingArtworkRecord[];
  floorPlan: EventFloorPlanConfig | null;
  floorPlanBooths: FloorPlanBoothRecord[];
  brandingItemOptions: BrandingItemOption[];
};

export async function loadPrintingDashboardPageData(): Promise<PrintingDashboardPageData | null> {
  const event = await getPrimaryPublishedEvent();
  if (!event) return null;

  const rows = await prisma.brandingArtworkSubmission.findMany({
    where: {
      eventExhibitor: { eventId: event.id },
      NOT: { status: "DRAFT" },
    },
    include: {
      itemMaster: true,
      eventExhibitor: { include: { exhibitor: true } },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
  });

  const boothAssignments = await prisma.eventBooth.findMany({
    where: { eventId: event.id, eventExhibitorId: { not: null } },
    select: { code: true, eventExhibitorId: true },
  });
  const boothCodeByExhibitorId = new Map(
    boothAssignments.map((row) => [row.eventExhibitorId!, row.code])
  );

  const records: AdminBrandingArtworkRecord[] = rows.map((row) => ({
    ...serializeBrandingArtworkSubmission(row),
    companyName: row.eventExhibitor.exhibitor.companyName,
    boothNumber:
      boothCodeByExhibitorId.get(row.eventExhibitorId) ?? row.eventExhibitor.boothNumber,
    hall: row.eventExhibitor.hall,
    contactName: row.eventExhibitor.exhibitor.contactName,
    contactEmail: row.eventExhibitor.exhibitor.contactEmail,
    statusHistory: row.statusHistory.map(serializeBrandingStatusHistory),
  }));

  const catalogRows = await prisma.eventItemMaster.findMany({
    where: { eventId: event.id },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });
  const brandingItemOptions: BrandingItemOption[] = catalogRows
    .filter((row) => isBrandingCategory(row.category))
    .map((row) => ({ id: row.id, name: row.name }));

  const floorPlanSnapshot = await loadEventFloorPlanBooths(event.id);

  return {
    eventTitle: event.title,
    eventLocation: event.venue?.city ?? "Kenya",
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    records,
    floorPlan: floorPlanSnapshot?.floorPlan ?? null,
    floorPlanBooths: floorPlanSnapshot?.booths ?? [],
    brandingItemOptions,
  };
}

export async function loadPrintingDashboardPageDataWithRetry() {
  return withDbRetry(() => loadPrintingDashboardPageData());
}
