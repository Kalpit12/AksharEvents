import type { EventActivityOption } from "@/lib/event-activity-types";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import {
  serializeEventHotel,
  serializeEventItemMaster,
  serializeEventRestaurant,
  serializeEventScheduleItem,
} from "@/lib/event-config-types";
import { listAirBookingRequestsForExhibitor } from "@/lib/air-booking-actions";
import { listAirBookingMemberWorkflowsForExhibitor } from "@/lib/air-booking-workflow-actions";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { SerializedAirBookingMemberWorkflow } from "@/lib/air-booking-workflow-types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import { getOpenExhibitorEvents, type OpenExhibitorEvent } from "@/lib/exhibitor-events";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma, withDbRetry } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";
import type { Exhibitor, ExhibitorMemberRole } from "@prisma/client";

const eventExhibitorInclude = {
  registration: true,
  event: {
    include: {
      venue: { select: { name: true, city: true } },
    },
  },
} as const;

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

export type ExhibitorDashboardPageData = {
  exhibitor: Exhibitor;
  membershipRole: ExhibitorMemberRole | "OWNER";
  eventExhibitorId: string | null;
  savedRegistration: SavedRegistrationData | null;
  registrationStatus: "DRAFT" | "SUBMITTED" | null;
  eventTitle: string;
  eventVenue: string;
  eventCity: string;
  startDate: string;
  endDate: string;
  boothNumber: string | null;
  hall: string | null;
  expoDays: number;
  eventActivities: EventActivityOption[];
  eventHotels: ReturnType<typeof serializeEventHotel>[];
  eventRestaurants: ReturnType<typeof serializeEventRestaurant>[];
  eventSchedule: ReturnType<typeof serializeEventScheduleItem>[];
  itemCatalog: ReturnType<typeof serializeEventItemMaster>[];
  openEvents: OpenExhibitorEvent[];
  memberDocuments: SerializedMemberDocument[];
  airBookingRequests: SerializedAirBookingRequest[];
  memberWorkflows: SerializedAirBookingMemberWorkflow[];
};

export async function loadExhibitorDashboardPageData(
  exhibitor: Exhibitor,
  membershipRole: ExhibitorMemberRole | "OWNER"
): Promise<ExhibitorDashboardPageData> {
  const primaryEvent = await getPrimaryPublishedEvent();
  const openEvents = await getOpenExhibitorEvents();

  let eventEntry = primaryEvent
    ? await prisma.eventExhibitor.findFirst({
        where: {
          exhibitorId: exhibitor.id,
          eventId: primaryEvent.id,
        },
        include: eventExhibitorInclude,
      })
    : null;

  if (!eventEntry) {
    eventEntry = await prisma.eventExhibitor.findFirst({
      where: { exhibitorId: exhibitor.id },
      orderBy: { event: { startDate: "asc" } },
      include: eventExhibitorInclude,
    });
  }

  const event = eventEntry?.event ?? primaryEvent;
  const expoDays = event
    ? Math.max(1, differenceInCalendarDays(event.endDate, event.startDate) + 1)
    : 1;

  const savedRegistration = eventEntry?.registration?.formData
    ? (eventEntry.registration.formData as SavedRegistrationData)
    : null;

  let activities: Awaited<ReturnType<typeof prisma.eventActivity.findMany>> = [];
  let eventHotels: Awaited<ReturnType<typeof prisma.eventHotel.findMany>> = [];
  let eventRestaurants: Awaited<ReturnType<typeof prisma.eventRestaurant.findMany>> = [];
  let eventSchedule: Awaited<ReturnType<typeof prisma.eventScheduleItem.findMany>> = [];
  let itemCatalogRows: Awaited<ReturnType<typeof prisma.eventItemMaster.findMany>> = [];

  if (event) {
    [activities, eventHotels, eventRestaurants, eventSchedule, itemCatalogRows] =
      await prisma.$transaction([
        prisma.eventActivity.findMany({
          where: { eventId: event.id, isActive: true },
          orderBy: { startAt: "asc" },
        }),
        prisma.eventHotel.findMany({
          where: { eventId: event.id, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.eventRestaurant.findMany({
          where: { eventId: event.id, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.eventScheduleItem.findMany({
          where: { eventId: event.id, isActive: true },
          orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }],
        }),
        prisma.eventItemMaster.findMany({
          where: { eventId: event.id },
          orderBy: [{ category: "asc" }, { name: "asc" }],
        }),
      ]);
  }

  let memberDocuments: Awaited<ReturnType<typeof prisma.exhibitorMemberDocument.findMany>> = [];
  let serializedAirBookingRequests: SerializedAirBookingRequest[] = [];
  let serializedMemberWorkflows: SerializedAirBookingMemberWorkflow[] = [];

  if (eventEntry) {
    memberDocuments = await prisma.exhibitorMemberDocument.findMany({
      where: { eventExhibitorId: eventEntry.id },
      orderBy: { createdAt: "desc" },
    });

    const airBookingRequests = await listAirBookingRequestsForExhibitor(eventEntry.id);
    serializedAirBookingRequests =
      airBookingRequests.success && airBookingRequests.requests ? airBookingRequests.requests : [];

    const memberWorkflows = await listAirBookingMemberWorkflowsForExhibitor(eventEntry.id);
    serializedMemberWorkflows =
      memberWorkflows.success && memberWorkflows.workflows ? memberWorkflows.workflows : [];
  }

  const serializedMemberDocuments: SerializedMemberDocument[] = memberDocuments.map((doc) => ({
    id: doc.id,
    eventExhibitorId: doc.eventExhibitorId,
    memberLocalId: doc.memberLocalId,
    documentType: doc.documentType,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    uploadedAt: doc.createdAt.toISOString(),
  }));

  return {
    exhibitor,
    membershipRole,
    eventExhibitorId: eventEntry?.id ?? null,
    savedRegistration,
    registrationStatus: eventEntry?.registration?.status ?? null,
    eventTitle: event?.title ?? "Upcoming event",
    eventVenue: event?.venue?.name ?? "Venue TBC",
    eventCity: event?.venue?.city ?? "Kenya",
    startDate: (event?.startDate ?? new Date()).toISOString(),
    endDate: (event?.endDate ?? new Date()).toISOString(),
    boothNumber: eventEntry?.boothNumber ?? null,
    hall: eventEntry?.hall ?? null,
    expoDays,
    eventActivities: activities.map(serializeActivity),
    eventHotels: eventHotels.map(serializeEventHotel),
    eventRestaurants: eventRestaurants.map(serializeEventRestaurant),
    eventSchedule: eventSchedule.map(serializeEventScheduleItem),
    itemCatalog: itemCatalogRows.map(serializeEventItemMaster),
    openEvents,
    memberDocuments: serializedMemberDocuments,
    airBookingRequests: serializedAirBookingRequests,
    memberWorkflows: serializedMemberWorkflows,
  };
}

export async function loadExhibitorDashboardPageDataWithRetry(
  exhibitor: Exhibitor,
  membershipRole: ExhibitorMemberRole | "OWNER"
) {
  return withDbRetry(() => loadExhibitorDashboardPageData(exhibitor, membershipRole));
}
