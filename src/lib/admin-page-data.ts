import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import {
  serializeEventHotel,
  serializeEventItemMaster,
  serializeEventRestaurant,
  serializeEventScheduleItem,
} from "@/lib/event-config-types";
import { getEventFloorPlanBooths } from "@/lib/floor-plan-actions";
import { loadEventTourTravelItineraries } from "@/lib/itinerary-actions";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { FLOOR_PLAN_IMAGE, FLOOR_PLAN_VIEWBOX } from "@/lib/floor-plan-layout";
import type { EventFloorPlanConfig, FloorPlanBoothRecord } from "@/lib/floor-plan-types";
import { prisma, withDbRetry } from "@/lib/prisma";
import type {
  EventHotelOption,
  EventItemMasterOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";

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

export type AdminEventMasterPageData = {
  exhibitors: AdminExhibitorRecord[];
  activities: EventActivityOption[];
  eventHotels: EventHotelOption[];
  eventRestaurants: EventRestaurantOption[];
  scheduleItems: EventScheduleItemOption[];
  itemMaster: EventItemMasterOption[];
  floorPlanBooths: FloorPlanBoothRecord[];
  floorPlan: EventFloorPlanConfig;
  tourTravelItineraries: SerializedTourTravelItinerary[];
};

const defaultFloorPlan: EventFloorPlanConfig = {
  imageUrl: FLOOR_PLAN_IMAGE,
  svgUrl: null,
  viewBox: { ...FLOOR_PLAN_VIEWBOX },
  isCustom: false,
};

export async function loadAdminEventMasterPageData(eventId: string): Promise<AdminEventMasterPageData> {
  // Load in small batches to avoid exhausting the dev connection pool (limit: 3).
  const [eventExhibitors, activities, eventHotels] = await Promise.all([
    prisma.eventExhibitor.findMany({
      where: { eventId },
      include: {
        exhibitor: true,
        registration: true,
      },
      orderBy: { exhibitor: { companyName: "asc" } },
    }),
    prisma.eventActivity.findMany({
      where: { eventId, isActive: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.eventHotel.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const [eventRestaurants, scheduleItems, itemMasterRows] = await Promise.all([
    prisma.eventRestaurant.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.eventScheduleItem.findMany({
      where: { eventId },
      orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.eventItemMaster.findMany({
      where: { eventId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const [floorPlanResult, tourTravelItineraries] = await Promise.all([
    getEventFloorPlanBooths(eventId),
    loadEventTourTravelItineraries(eventId),
  ]);

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

  return {
    exhibitors,
    activities: activities.map(serializeActivity),
    eventHotels: eventHotels.map(serializeEventHotel),
    eventRestaurants: eventRestaurants.map(serializeEventRestaurant),
    scheduleItems: scheduleItems.map(serializeEventScheduleItem),
    itemMaster: itemMasterRows.map(serializeEventItemMaster),
    floorPlanBooths: floorPlanResult.booths ?? [],
    floorPlan: floorPlanResult.floorPlan ?? defaultFloorPlan,
    tourTravelItineraries,
  };
}

export function loadAdminEventMasterPageDataWithRetry(eventId: string) {
  return withDbRetry(() => loadAdminEventMasterPageData(eventId));
}
