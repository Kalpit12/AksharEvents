import { prisma } from "@/lib/prisma";
import type { ExhibitorMemberRole } from "@prisma/client";

export async function getExhibitorForUser(userId: string) {
  const owned = await prisma.exhibitor.findUnique({
    where: { userId },
  });
  if (owned) return owned;

  const membership = await prisma.exhibitorMember.findFirst({
    where: { userId },
    include: { exhibitor: true },
  });
  return membership?.exhibitor ?? null;
}

export async function getExhibitorMembership(userId: string, exhibitorId: string) {
  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: exhibitorId },
    select: { userId: true },
  });
  if (!exhibitor) return null;

  if (exhibitor.userId === userId) {
    return { role: "OWNER" as ExhibitorMemberRole, isOwner: true as const };
  }

  const member = await prisma.exhibitorMember.findUnique({
    where: { exhibitorId_userId: { exhibitorId, userId } },
    select: { role: true },
  });
  if (!member) return null;

  return { role: member.role, isOwner: false as const };
}

export async function requireExhibitorAccess(userId: string) {
  const exhibitor = await getExhibitorForUser(userId);
  if (!exhibitor) return null;

  const membership = await getExhibitorMembership(userId, exhibitor.id);
  return { exhibitor, membership };
}

export function canManageMembers(role: ExhibitorMemberRole | "OWNER") {
  return role === "OWNER" || role === "ADMIN";
}

export async function getEventExhibitorForUser(userId: string, eventSlug: string) {
  const access = await requireExhibitorAccess(userId);
  if (!access) return null;

  const eventExhibitor = await prisma.eventExhibitor.findFirst({
    where: {
      exhibitorId: access.exhibitor.id,
      event: { slug: eventSlug },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
      itineraryItems: {
        orderBy: [{ startAt: "asc" }, { order: "asc" }],
        include: {
          assignedMember: {
            include: { user: { select: { name: true, email: true } } },
          },
          activityBooking: {
            include: {
              activity: true,
            },
          },
        },
      },
    },
  });

  return eventExhibitor ? { ...access, eventExhibitor } : null;
}

export async function getExhibitorDashboardData(userId: string) {
  const access = await requireExhibitorAccess(userId);
  if (!access) return null;

  const [events, members, upcomingItinerary] = await Promise.all([
    prisma.eventExhibitor.findMany({
      where: { exhibitorId: access.exhibitor.id },
      include: {
        event: {
          select: { title: true, slug: true, startDate: true, status: true },
        },
        _count: { select: { itineraryItems: true } },
      },
      orderBy: { event: { startDate: "asc" } },
      take: 5,
    }),
    prisma.exhibitorMember.findMany({
      where: { exhibitorId: access.exhibitor.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.itineraryItem.findMany({
      where: {
        eventExhibitor: { exhibitorId: access.exhibitor.id },
        startAt: { gte: new Date() },
      },
      include: {
        eventExhibitor: {
          include: { event: { select: { title: true, slug: true } } },
        },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
  ]);

  return { ...access, events, members, upcomingItinerary };
}
