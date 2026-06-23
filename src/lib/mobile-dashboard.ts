import { differenceInCalendarDays } from "date-fns";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { EventActivityOption } from "@/lib/event-activity-types";
import {
  aggregateDietary,
  aggregateHotelAssignments,
  aggregateHotelRequests,
  aggregateMeals,
  aggregateMembers,
  aggregateTransport,
  expoDaysFromRange,
  groupActivitiesByDay,
} from "@/lib/event-master-aggregations";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma } from "@/lib/prisma";

function serializeActivity(activity: {
  id: string;
  kind: "TOUR" | "TRAVEL";
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  price: { toNumber(): number };
  currency: string;
  maxSlots: number | null;
}): EventActivityOption {
  return {
    id: activity.id,
    kind: activity.kind,
    title: activity.title,
    description: activity.description,
    startAt: activity.startAt.toISOString(),
    endAt: activity.endAt?.toISOString() ?? null,
    location: activity.location,
    price: activity.price.toNumber(),
    currency: activity.currency,
    maxSlots: activity.maxSlots,
  };
}

const eventExhibitorInclude = {
  registration: true,
  event: { include: { venue: { select: { name: true, city: true } } } },
} as const;

export async function getMobileExhibitorDashboard(userId: string) {
  const access = await requireExhibitorAccess(userId);
  if (!access) return null;

  const primaryEvent = await getPrimaryPublishedEvent();
  let eventEntry = primaryEvent
    ? await prisma.eventExhibitor.findFirst({
        where: { exhibitorId: access.exhibitor.id, eventId: primaryEvent.id },
        include: eventExhibitorInclude,
      })
    : null;

  if (!eventEntry) {
    eventEntry = await prisma.eventExhibitor.findFirst({
      where: { exhibitorId: access.exhibitor.id },
      orderBy: { event: { startDate: "asc" } },
      include: eventExhibitorInclude,
    });
  }

  const event = eventEntry?.event ?? primaryEvent;
  const activities = event
    ? await prisma.eventActivity.findMany({
        where: { eventId: event.id, isActive: true },
        orderBy: { startAt: "asc" },
      })
    : [];

  const savedRegistration = eventEntry?.registration?.formData
    ? (eventEntry.registration.formData as SavedRegistrationData)
    : null;

  const expoDays = event
    ? Math.max(1, differenceInCalendarDays(event.endDate, event.startDate) + 1)
    : 1;

  const memberCount = savedRegistration?.members?.length ?? 0;
  const formSteps = savedRegistration?.formSteps;

  return {
    exhibitor: {
      id: access.exhibitor.id,
      companyName: access.exhibitor.companyName,
      contactName: access.exhibitor.contactName,
      contactEmail: access.exhibitor.contactEmail,
      contactPhone: access.exhibitor.contactPhone,
      membershipRole: access.membership?.role ?? "OWNER",
    },
    eventExhibitorId: eventEntry?.id ?? null,
    registrationStatus: eventEntry?.registration?.status ?? null,
    savedRegistration,
    event: event
      ? {
          title: event.title,
          slug: event.slug,
          venue: event.venue?.name ?? "Venue TBC",
          city: event.venue?.city ?? "Kenya",
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          expoDays,
          boothNumber: eventEntry?.boothNumber ?? null,
          hall: eventEntry?.hall ?? null,
        }
      : null,
    metrics: {
      teamMembers: memberCount,
      toursSelected: savedRegistration?.selectedTours?.length ?? 0,
      mealsSelected: savedRegistration?.selectedMeals?.length ?? 0,
      shuttles: savedRegistration?.shuttles?.length ?? 0,
      formCompletePct: formSteps
        ? Math.round(
            (Object.values(formSteps).filter(Boolean).length / Object.keys(formSteps).length) * 100,
          )
        : 0,
    },
    eventActivities: activities.map(serializeActivity),
  };
}

export async function getMobileAdminDashboard() {
  const event = await getPrimaryPublishedEvent();
  if (!event) return { event: null, exhibitors: [], activities: [], aggregates: null };

  const location = event.venue?.city ?? "Kenya";

  const eventExhibitors = await prisma.eventExhibitor.findMany({
    where: { eventId: event.id },
    include: { exhibitor: true, registration: true },
    orderBy: { exhibitor: { companyName: "asc" } },
  });

  const activities = await prisma.eventActivity.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { startAt: "asc" },
  });

  const exhibitors: AdminExhibitorRecord[] = eventExhibitors.map((entry) => ({
    id: entry.id,
    companyName: entry.exhibitor.companyName,
    slug: entry.exhibitor.slug,
    boothNumber: entry.boothNumber,
    hall: entry.hall,
    contactName: entry.exhibitor.contactName,
    contactEmail: entry.exhibitor.contactEmail,
    contactPhone: entry.exhibitor.contactPhone,
    website: entry.exhibitor.website,
    products: entry.exhibitor.products,
    registrationStatus: entry.registration?.status ?? null,
    submittedAt: entry.registration?.submittedAt?.toISOString() ?? null,
    formData: entry.registration?.formData
      ? (entry.registration.formData as SavedRegistrationData)
      : null,
  }));

  const serializedActivities = activities.map(serializeActivity);
  const startDate = event.startDate.toISOString();
  const endDate = event.endDate.toISOString();

  return {
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      location,
      startDate,
      endDate,
      expoDays: expoDaysFromRange(startDate, endDate),
    },
    exhibitors,
    activities: serializedActivities,
    aggregates: {
      members: aggregateMembers(exhibitors),
      transport: aggregateTransport(exhibitors, serializedActivities),
      hotelRequests: aggregateHotelRequests(exhibitors),
      hotelAssignments: aggregateHotelAssignments(exhibitors),
      meals: aggregateMeals(exhibitors),
      dietary: aggregateDietary(exhibitors),
      scheduleByDay: groupActivitiesByDay(serializedActivities),
    },
  };
}
