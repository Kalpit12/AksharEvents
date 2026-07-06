import { isPrismaSchemaDriftError, prisma, withDbRetry } from "@/lib/prisma";

export type BoothVisitRecord = {
  id: string;
  eventExhibitorId: string;
  companyName: string;
  boothNumber: string | null;
  bookingId: string;
  bookingNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeCompany: string | null;
  attendeeDesignation: string | null;
  scannedAt: string;
};

export type BoothExhibitorVisitSummary = {
  eventExhibitorId: string;
  companyName: string;
  boothNumber: string | null;
  hall: string | null;
  boothKioskEnabled: boolean;
  boothKioskToken: string | null;
  hasPassword: boolean;
  visitorCount: number;
};

export type BoothVisitStats = {
  totalVisitors: number;
  exhibitors: BoothExhibitorVisitSummary[];
  records: BoothVisitRecord[];
};

async function loadBoothVisitsForEvent(eventId: string): Promise<BoothVisitStats> {
  const [eventExhibitors, visits] = await Promise.all([
    prisma.eventExhibitor.findMany({
      where: { eventId },
      include: { exhibitor: { select: { companyName: true } } },
      orderBy: { exhibitor: { companyName: "asc" } },
    }),
    prisma.boothVisit.findMany({
      where: { eventId },
      include: {
        booking: { select: { bookingNumber: true } },
        eventExhibitor: {
          include: { exhibitor: { select: { companyName: true } } },
        },
      },
      orderBy: { scannedAt: "desc" },
    }),
  ]);

  const countByExhibitor = new Map<string, number>();
  for (const visit of visits) {
    countByExhibitor.set(
      visit.eventExhibitorId,
      (countByExhibitor.get(visit.eventExhibitorId) ?? 0) + 1
    );
  }

  const exhibitors: BoothExhibitorVisitSummary[] = eventExhibitors.map((entry) => ({
    eventExhibitorId: entry.id,
    companyName: entry.exhibitor.companyName,
    boothNumber: entry.boothNumber,
    hall: entry.hall,
    boothKioskEnabled: entry.boothKioskEnabled,
    boothKioskToken: entry.boothKioskToken,
    hasPassword: Boolean(entry.boothKioskPasswordHash),
    visitorCount: countByExhibitor.get(entry.id) ?? 0,
  }));

  const records: BoothVisitRecord[] = visits.map((visit) => ({
    id: visit.id,
    eventExhibitorId: visit.eventExhibitorId,
    companyName: visit.eventExhibitor.exhibitor.companyName,
    boothNumber: visit.eventExhibitor.boothNumber,
    bookingId: visit.bookingId,
    bookingNumber: visit.booking.bookingNumber,
    attendeeName: visit.attendeeName,
    attendeeEmail: visit.attendeeEmail,
    attendeeCompany: visit.attendeeCompany,
    attendeeDesignation: visit.attendeeDesignation,
    scannedAt: visit.scannedAt.toISOString(),
  }));

  return {
    totalVisitors: visits.length,
    exhibitors,
    records,
  };
}

export async function loadBoothVisitStats(eventId: string): Promise<BoothVisitStats> {
  try {
    return await loadBoothVisitsForEvent(eventId);
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return { totalVisitors: 0, exhibitors: [], records: [] };
    }
    throw error;
  }
}

export function loadBoothVisitStatsWithRetry(eventId: string) {
  return withDbRetry(() => loadBoothVisitStats(eventId));
}

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
