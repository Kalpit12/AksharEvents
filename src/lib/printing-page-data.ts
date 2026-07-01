import { serializeBrandingArtworkSubmission, type AdminBrandingArtworkRecord } from "@/lib/branding-artwork-types";
import { serializeBrandingStatusHistory } from "@/lib/branding-artwork-history";
import { loadEventFloorPlanBooths } from "@/lib/floor-plan-data";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
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

  const records: AdminBrandingArtworkRecord[] = rows.map((row) => ({
    ...serializeBrandingArtworkSubmission(row),
    companyName: row.eventExhibitor.exhibitor.companyName,
    boothNumber: row.eventExhibitor.boothNumber,
    hall: row.eventExhibitor.hall,
    contactName: row.eventExhibitor.exhibitor.contactName,
    contactEmail: row.eventExhibitor.exhibitor.contactEmail,
    statusHistory: row.statusHistory.map(serializeBrandingStatusHistory),
  }));

  const floorPlanSnapshot = await loadEventFloorPlanBooths(event.id);

  return {
    eventTitle: event.title,
    eventLocation: event.venue?.city ?? "Kenya",
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    records,
    floorPlan: floorPlanSnapshot?.floorPlan ?? null,
    floorPlanBooths: floorPlanSnapshot?.booths ?? [],
  };
}

export async function loadPrintingDashboardPageDataWithRetry() {
  return withDbRetry(() => loadPrintingDashboardPageData());
}
