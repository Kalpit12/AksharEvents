import type { TourTravelStopType } from "@prisma/client";

export type SerializedTourTravelStop = {
  id: string;
  stopType: TourTravelStopType;
  title: string;
  location: string | null;
  placeImageUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  notes: string | null;
  sortOrder: number;
};

export type SerializedTourTravelDay = {
  id: string;
  dayIndex: number;
  dayDate: string | null;
  title: string | null;
  stops: SerializedTourTravelStop[];
};

export type SerializedTourTravelItinerary = {
  id: string;
  title: string;
  description: string | null;
  vehicleInfo: string | null;
  memberCount: number | null;
  hotelInfo: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  days: SerializedTourTravelDay[];
};

export const TOUR_TRAVEL_STOP_LABELS: Record<TourTravelStopType, string> = {
  START: "Start",
  STOP: "Stop",
  STAY: "Stay",
};

export function serializeTourTravelItinerary(row: {
  id: string;
  title: string;
  description: string | null;
  vehicleInfo: string | null;
  memberCount: number | null;
  hotelInfo: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  days: {
    id: string;
    dayIndex: number;
    dayDate: Date | null;
    title: string | null;
    stops: {
      id: string;
      stopType: TourTravelStopType;
      title: string;
      location: string | null;
      placeImageUrl?: string | null;
      startAt: Date | null;
      endAt: Date | null;
      notes: string | null;
      sortOrder: number;
    }[];
  }[];
}): SerializedTourTravelItinerary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    vehicleInfo: row.vehicleInfo,
    memberCount: row.memberCount,
    hotelInfo: row.hotelInfo,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    days: row.days
      .sort((a, b) => a.dayIndex - b.dayIndex)
      .map((day) => ({
        id: day.id,
        dayIndex: day.dayIndex,
        dayDate: day.dayDate?.toISOString() ?? null,
        title: day.title,
        stops: day.stops
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((stop) => ({
            id: stop.id,
            stopType: stop.stopType,
            title: stop.title,
            location: stop.location,
            placeImageUrl: stop.placeImageUrl ?? null,
            startAt: stop.startAt?.toISOString() ?? null,
            endAt: stop.endAt?.toISOString() ?? null,
            notes: stop.notes,
            sortOrder: stop.sortOrder,
          })),
      })),
  };
}
