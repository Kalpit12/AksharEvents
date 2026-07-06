import { isPrismaSchemaDriftError, prisma, withDbRetry } from "@/lib/prisma";

export type ExhibitorBoothVisitRecord = {
  id: string;
  bookingNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeCompany: string | null;
  attendeeDesignation: string | null;
  scannedAt: string;
};

export async function loadBoothVisitsForExhibitor(eventExhibitorId: string) {
  try {
    const visits = await prisma.boothVisit.findMany({
      where: { eventExhibitorId },
      include: { booking: { select: { bookingNumber: true } } },
      orderBy: { scannedAt: "desc" },
    });

    return {
      visitorCount: visits.length,
      records: visits.map((visit) => ({
        id: visit.id,
        bookingNumber: visit.booking.bookingNumber,
        attendeeName: visit.attendeeName,
        attendeeEmail: visit.attendeeEmail,
        attendeeCompany: visit.attendeeCompany,
        attendeeDesignation: visit.attendeeDesignation,
        scannedAt: visit.scannedAt.toISOString(),
      })) satisfies ExhibitorBoothVisitRecord[],
    };
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { visitorCount: 0, records: [] as ExhibitorBoothVisitRecord[] };
    }
    throw error;
  }
}

export function loadBoothVisitsForExhibitorWithRetry(eventExhibitorId: string) {
  return withDbRetry(() => loadBoothVisitsForExhibitor(eventExhibitorId));
}
