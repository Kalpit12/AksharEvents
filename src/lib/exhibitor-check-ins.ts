import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { formatExhibitorBadgeCode } from "@/lib/exhibitor-badge-codes";
import { prisma, withDbRetry } from "@/lib/prisma";

export type ExhibitorCheckInRecord = {
  id: string;
  eventExhibitorId: string;
  memberLocalId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  companyName: string;
  boothLabel: string | null;
  badgeCode: string;
  hasBadgePhoto: boolean;
  registeredAt: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
};

export type ExhibitorCheckInStats = {
  totalRegistrations: number;
  checkedIn: number;
  pending: number;
  records: ExhibitorCheckInRecord[];
};

export async function loadExhibitorCheckInStats(eventId: string): Promise<ExhibitorCheckInStats> {
  const eventExhibitors = await prisma.eventExhibitor.findMany({
    where: { eventId },
    include: {
      exhibitor: { select: { companyName: true } },
      registration: {
        select: { formData: true, submittedAt: true, status: true },
      },
      badgeCheckIns: true,
      memberDocuments: {
        where: { documentType: "BADGE_PHOTO" },
        select: { memberLocalId: true },
      },
    },
    orderBy: { exhibitor: { companyName: "asc" } },
  });

  const records: ExhibitorCheckInRecord[] = [];

  for (const link of eventExhibitors) {
    const registration = link.registration?.formData as SavedRegistrationData | null | undefined;
    const members = registration?.members ?? [];
    if (members.length === 0) continue;

    const companyName =
      registration?.form?.company?.trim() || link.exhibitor.companyName;
    const boothLabel = link.boothNumber?.trim() || null;
    const photoIds = new Set(link.memberDocuments.map((doc) => doc.memberLocalId));
    const checkInByMember = new Map(
      link.badgeCheckIns.map((row) => [row.memberLocalId, row] as const)
    );

    for (const member of members) {
      const checkIn = checkInByMember.get(member.id);
      records.push({
        id: `${link.id}:${member.id}`,
        eventExhibitorId: link.id,
        memberLocalId: member.id,
        memberName: `${member.fn} ${member.ln}`.trim(),
        memberEmail: member.email,
        memberRole: member.role,
        companyName,
        boothLabel,
        badgeCode: formatExhibitorBadgeCode(member.id),
        hasBadgePhoto: photoIds.has(member.id),
        registeredAt: link.registration?.submittedAt?.toISOString() ?? null,
        checkedIn: Boolean(checkIn),
        checkedInAt: checkIn?.checkedInAt.toISOString() ?? null,
      });
    }
  }

  records.sort((a, b) => {
    if (a.checkedIn !== b.checkedIn) return a.checkedIn ? 1 : -1;
    return a.memberName.localeCompare(b.memberName);
  });

  const checkedIn = records.filter((row) => row.checkedIn).length;

  return {
    totalRegistrations: records.length,
    checkedIn,
    pending: records.length - checkedIn,
    records,
  };
}

export function loadExhibitorCheckInStatsWithRetry(eventId: string) {
  return withDbRetry(() => loadExhibitorCheckInStats(eventId));
}
