import { prisma, withDbRetry } from "@/lib/prisma";

export type VisitorCheckInRecord = {
  id: string;
  bookingNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  attendeeDesignation: string | null;
  attendeeCompany: string | null;
  attendeeSector: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  registeredAt: string;
};

export type VisitorCheckInStats = {
  totalRegistrations: number;
  checkedIn: number;
  pending: number;
  records: VisitorCheckInRecord[];
};

export async function loadVisitorCheckInStats(eventId: string): Promise<VisitorCheckInStats> {
  const bookings = await prisma.booking.findMany({
    where: { eventId, status: "CONFIRMED" },
    include: { attendance: true },
    orderBy: [{ checkedIn: "asc" }, { createdAt: "desc" }],
  });

  const records: VisitorCheckInRecord[] = bookings.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    attendeeName: b.attendeeName,
    attendeeEmail: b.attendeeEmail,
    attendeePhone: b.attendeePhone,
    attendeeDesignation: b.attendeeDesignation,
    attendeeCompany: b.attendeeCompany,
    attendeeSector: b.attendeeSector,
    checkedIn: b.checkedIn || Boolean(b.attendance),
    checkedInAt: (b.checkedInAt ?? b.attendance?.checkedInAt)?.toISOString() ?? null,
    registeredAt: b.createdAt.toISOString(),
  }));

  const checkedIn = records.filter((r) => r.checkedIn).length;

  return {
    totalRegistrations: records.length,
    checkedIn,
    pending: records.length - checkedIn,
    records,
  };
}

export function loadVisitorCheckInStatsWithRetry(eventId: string) {
  return withDbRetry(() => loadVisitorCheckInStats(eventId));
}
