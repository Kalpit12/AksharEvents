import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { formatExhibitorBadgeCode } from "@/lib/exhibitor-badge-codes";
import { isPrismaSchemaDriftError, prisma, withDbRetry } from "@/lib/prisma";

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

type ExhibitorLinkForCheckIns = {
  id: string;
  boothNumber: string | null;
  exhibitor: { companyName: string };
  registration: {
    formData: unknown;
    submittedAt: Date | null;
    status: string;
  } | null;
  badgeCheckIns?: { memberLocalId: string; checkedInAt: Date }[];
  memberDocuments?: { memberLocalId: string }[];
};

function buildExhibitorCheckInRecords(
  eventExhibitors: ExhibitorLinkForCheckIns[],
  options: { includeBadgeData: boolean }
): ExhibitorCheckInStats {
  const records: ExhibitorCheckInRecord[] = [];

  for (const link of eventExhibitors) {
    const registration = link.registration?.formData as SavedRegistrationData | null | undefined;
    const members = registration?.members ?? [];
    if (members.length === 0) continue;

    const companyName =
      registration?.form?.company?.trim() || link.exhibitor.companyName;
    const boothLabel = link.boothNumber?.trim() || null;
    const photoIds = options.includeBadgeData
      ? new Set((link.memberDocuments ?? []).map((doc) => doc.memberLocalId))
      : new Set<string>();
    const checkInByMember = options.includeBadgeData
      ? new Map(
          (link.badgeCheckIns ?? []).map((row) => [row.memberLocalId, row] as const)
        )
      : new Map<string, { checkedInAt: Date }>();

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

async function loadBadgeCheckInsForEvent(eventId: string) {
  try {
    return await prisma.exhibitorBadgeCheckIn.findMany({
      where: { eventId },
      select: { eventExhibitorId: true, memberLocalId: true, checkedInAt: true },
    });
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return [];
    }
    throw error;
  }
}

async function loadBadgePhotosForEvent(eventId: string) {
  try {
    return await prisma.exhibitorMemberDocument.findMany({
      where: {
        eventExhibitor: { eventId },
        documentType: "BADGE_PHOTO",
      },
      select: { eventExhibitorId: true, memberLocalId: true },
    });
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return [];
    }
    throw error;
  }
}

export async function loadExhibitorCheckInStats(eventId: string): Promise<ExhibitorCheckInStats> {
  const [eventExhibitors, badgeCheckIns, badgePhotos] = await Promise.all([
    prisma.eventExhibitor.findMany({
      where: { eventId },
      include: {
        exhibitor: { select: { companyName: true } },
        registration: {
          select: { formData: true, submittedAt: true, status: true },
        },
      },
      orderBy: { exhibitor: { companyName: "asc" } },
    }),
    loadBadgeCheckInsForEvent(eventId),
    loadBadgePhotosForEvent(eventId),
  ]);

  const checkInsByExhibitor = new Map<string, { memberLocalId: string; checkedInAt: Date }[]>();
  for (const row of badgeCheckIns) {
    const list = checkInsByExhibitor.get(row.eventExhibitorId) ?? [];
    list.push({ memberLocalId: row.memberLocalId, checkedInAt: row.checkedInAt });
    checkInsByExhibitor.set(row.eventExhibitorId, list);
  }

  const photosByExhibitor = new Map<string, { memberLocalId: string }[]>();
  for (const row of badgePhotos) {
    const list = photosByExhibitor.get(row.eventExhibitorId) ?? [];
    list.push({ memberLocalId: row.memberLocalId });
    photosByExhibitor.set(row.eventExhibitorId, list);
  }

  const enriched: ExhibitorLinkForCheckIns[] = eventExhibitors.map((link) => ({
    ...link,
    badgeCheckIns: checkInsByExhibitor.get(link.id) ?? [],
    memberDocuments: photosByExhibitor.get(link.id) ?? [],
  }));

  return buildExhibitorCheckInRecords(enriched, {
    includeBadgeData: badgeCheckIns.length > 0 || badgePhotos.length > 0,
  });
}

export function loadExhibitorCheckInStatsWithRetry(eventId: string) {
  return withDbRetry(() => loadExhibitorCheckInStats(eventId));
}
