import type { EventActivityOption } from "@/lib/event-activity-types";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import {
  serializeEventHotel,
  serializeEventItemMaster,
  serializeEventRestaurant,
  serializeEventScheduleItem,
} from "@/lib/event-config-types";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import { serializeAirBookingRequest } from "@/lib/air-booking-types";
import { serializeWorkflow, type SerializedAirBookingMemberWorkflow } from "@/lib/air-booking-workflow-types";
import { serializeBrandingArtworkSubmission, type SerializedBrandingArtworkSubmission } from "@/lib/branding-artwork-types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import { loadPublishedTourTravelItineraries } from "@/lib/itinerary-actions";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { standLabelForBoothCode } from "@/lib/booth-allocation";
import {
  loadBoothVisitsForExhibitor,
  type ExhibitorBoothVisitRecord,
} from "@/lib/exhibitor-booth-visits";
import { redactRegistrationForClient } from "@/lib/registration-pii";
import { getOpenExhibitorEvents, type OpenExhibitorEvent } from "@/lib/exhibitor-events";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma, withDbRetry } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";
import type { Exhibitor, ExhibitorMemberRole } from "@prisma/client";

const eventExhibitorInclude = {
  registration: true,
  event: {
    select: {
      id: true,
      title: true,
      slug: true,
      startDate: true,
      endDate: true,
      venue: { select: { name: true, city: true } },
    },
  },
} as const;

const emptyEventConfig = [[], [], [], [], []] as const;

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

function pickEventEntry(
  eventEntries: Awaited<
    ReturnType<typeof prisma.eventExhibitor.findMany<{ include: typeof eventExhibitorInclude }>>
  >,
  primaryEventId: string | undefined
) {
  if (eventEntries.length === 0) return null;
  if (primaryEventId) {
    return eventEntries.find((entry) => entry.eventId === primaryEventId) ?? eventEntries[0];
  }
  return eventEntries[0];
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
  boothStandLabel: string | null;
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
  brandingArtworkSubmissions: SerializedBrandingArtworkSubmission[];
  tourTravelItineraries: SerializedTourTravelItinerary[];
  notificationUnreadCount: number;
  boothVisitorCount: number;
  boothVisitors: ExhibitorBoothVisitRecord[];
};

export async function loadExhibitorDashboardPageData(
  exhibitor: Exhibitor,
  membershipRole: ExhibitorMemberRole | "OWNER",
  userId: string
): Promise<ExhibitorDashboardPageData> {
  const [primaryEvent, openEvents, eventEntries] = await Promise.all([
    getPrimaryPublishedEvent(),
    getOpenExhibitorEvents(),
    prisma.eventExhibitor.findMany({
      where: { exhibitorId: exhibitor.id },
      include: eventExhibitorInclude,
      orderBy: { event: { startDate: "asc" } },
    }),
  ]);

  const eventEntry = pickEventEntry(eventEntries, primaryEvent?.id);
  const event = eventEntry?.event ?? primaryEvent;
  const expoDays = event
    ? Math.max(1, differenceInCalendarDays(event.endDate, event.startDate) + 1)
    : 1;

  const savedRegistration = redactRegistrationForClient(
    eventEntry?.registration?.formData
      ? (eventEntry.registration.formData as SavedRegistrationData)
      : null
  );

  const eventId = event?.id;
  const eventExhibitorId = eventEntry?.id;
  const canLoadDocuments = membershipRole !== "STAFF";

  const boothLookupEventId = eventEntry?.eventId ?? eventId;
  const assignedBoothWhere =
    eventExhibitorId || boothLookupEventId
      ? {
          OR: [
            ...(eventExhibitorId ? [{ eventExhibitorId }] : []),
            ...(boothLookupEventId
              ? [
                  {
                    eventId: boothLookupEventId,
                    companyName: { equals: exhibitor.companyName, mode: "insensitive" as const },
                  },
                ]
              : []),
          ],
        }
      : null;

  const [eventConfig, memberDocuments, airBookingRows, memberWorkflowRows, brandingArtworkRows, assignedBoothRow] =
    await Promise.all([
    eventId
      ? prisma.$transaction([
          prisma.eventActivity.findMany({
            where: { eventId, isActive: true },
            orderBy: { startAt: "asc" },
          }),
          prisma.eventHotel.findMany({
            where: { eventId, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          }),
          prisma.eventRestaurant.findMany({
            where: { eventId, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          }),
          prisma.eventScheduleItem.findMany({
            where: { eventId, isActive: true },
            orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }],
          }),
          prisma.eventItemMaster.findMany({
            where: { eventId },
            orderBy: [{ category: "asc" }, { name: "asc" }],
          }),
        ])
      : Promise.resolve([...emptyEventConfig]),
    eventExhibitorId && canLoadDocuments
      ? prisma.exhibitorMemberDocument.findMany({
          where: { eventExhibitorId },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    eventExhibitorId
      ? prisma.airBookingRequest.findMany({
          where: { eventExhibitorId },
          include: {
            eventExhibitor: { include: { exhibitor: true } },
            dispatches: { orderBy: { sentAt: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    eventExhibitorId
      ? prisma.airBookingMemberWorkflow.findMany({
          where: { eventExhibitorId },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    eventExhibitorId
      ? prisma.brandingArtworkSubmission.findMany({
          where: { eventExhibitorId },
          include: { itemMaster: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    assignedBoothWhere
      ? prisma.eventBooth.findFirst({
          where: assignedBoothWhere,
          select: { code: true },
        })
      : Promise.resolve(null),
  ]);

  const [activities, eventHotels, eventRestaurants, eventSchedule, itemCatalogRows] = eventConfig;

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

  const serializedAirBookingRequests = airBookingRows.map((row) =>
    serializeAirBookingRequest(row, row.eventExhibitor.exhibitor.companyName, {
      dispatches: row.dispatches,
    })
  );

  const serializedMemberWorkflows = memberWorkflowRows.map(serializeWorkflow);
  const serializedBrandingArtwork = brandingArtworkRows.map(serializeBrandingArtworkSubmission);

  const boothNumber =
    assignedBoothRow?.code?.toUpperCase() ?? eventEntry?.boothNumber?.toUpperCase() ?? null;
  const boothStandLabel = boothNumber ? standLabelForBoothCode(boothNumber) : null;

  const [tourTravelItineraries, notificationUnreadCount, boothVisitData] = await Promise.all([
    eventId ? loadPublishedTourTravelItineraries(eventId) : Promise.resolve([]),
    prisma.notification.count({ where: { userId, isRead: false } }),
    eventExhibitorId
      ? loadBoothVisitsForExhibitor(eventExhibitorId)
      : Promise.resolve({ visitorCount: 0, records: [] as ExhibitorBoothVisitRecord[] }),
  ]);

  return {
    exhibitor,
    membershipRole,
    eventExhibitorId: eventExhibitorId ?? null,
    savedRegistration,
    registrationStatus: eventEntry?.registration?.status ?? null,
    eventTitle: event?.title ?? "Upcoming event",
    eventVenue: event?.venue?.name ?? "Venue TBC",
    eventCity: event?.venue?.city ?? "Kenya",
    startDate: (event?.startDate ?? new Date()).toISOString(),
    endDate: (event?.endDate ?? new Date()).toISOString(),
    boothNumber,
    boothStandLabel,
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
    brandingArtworkSubmissions: serializedBrandingArtwork,
    tourTravelItineraries,
    notificationUnreadCount,
    boothVisitorCount: boothVisitData.visitorCount,
    boothVisitors: boothVisitData.records,
  };
}

export async function loadExhibitorDashboardPageDataWithRetry(
  exhibitor: Exhibitor,
  membershipRole: ExhibitorMemberRole | "OWNER",
  userId: string
) {
  return withDbRetry(() => loadExhibitorDashboardPageData(exhibitor, membershipRole, userId));
}
