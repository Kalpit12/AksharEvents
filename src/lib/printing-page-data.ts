import { serializeBrandingArtworkSubmission, type AdminBrandingArtworkRecord } from "@/lib/branding-artwork-types";
import { serializeBrandingStatusHistory } from "@/lib/branding-artwork-history";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma, withDbRetry } from "@/lib/prisma";

export type PrintingDashboardPageData = {
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  records: AdminBrandingArtworkRecord[];
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

  return {
    eventTitle: event.title,
    eventLocation: event.venue?.city ?? "Kenya",
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    records,
  };
}

export async function loadPrintingDashboardPageDataWithRetry() {
  return withDbRetry(() => loadPrintingDashboardPageData());
}
