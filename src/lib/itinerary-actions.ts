"use server";

import { revalidatePath } from "next/cache";
import type { TourTravelStopType } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { serializeTourTravelItinerary } from "@/lib/itinerary-types";
import { notifyEventExhibitorUsers, notifyTourTravelSelectedExhibitors } from "@/lib/notification-actions";
import { prisma } from "@/lib/prisma";

async function requireEventMaster() {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" as const, user: null };
  return { user, error: null };
}

const itineraryMetaSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  vehicleInfo: z.string().optional(),
  memberCount: z.coerce.number().int().min(0).optional(),
  hotelInfo: z.string().optional(),
});

const daySchema = z.object({
  itineraryId: z.string().min(1),
  dayIndex: z.coerce.number().int().min(1),
  dayDate: z.string().optional(),
  title: z.string().optional(),
});

const stopSchema = z.object({
  dayId: z.string().min(1),
  stopType: z.enum(["START", "STOP", "STAY"]),
  title: z.string().min(1),
  location: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function loadEventTourTravelItineraries(eventId: string) {
  const rows = await prisma.tourTravelItinerary.findMany({
    where: { eventId },
    include: {
      days: {
        include: { stops: true },
        orderBy: { dayIndex: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(serializeTourTravelItinerary);
}

export async function loadPublishedTourTravelItineraries(eventId: string) {
  const rows = await prisma.tourTravelItinerary.findMany({
    where: { eventId, isPublished: true },
    include: {
      days: {
        include: { stops: true },
        orderBy: { dayIndex: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(serializeTourTravelItinerary);
}

export async function createTourTravelItinerary(input: z.infer<typeof itineraryMetaSchema>) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = itineraryMetaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const row = await prisma.tourTravelItinerary.create({
    data: {
      eventId: parsed.data.eventId,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      vehicleInfo: parsed.data.vehicleInfo?.trim() || null,
      memberCount: parsed.data.memberCount ?? null,
      hotelInfo: parsed.data.hotelInfo?.trim() || null,
    },
    include: {
      days: { include: { stops: true } },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { itinerary: serializeTourTravelItinerary(row) };
}

export async function updateTourTravelItinerary(input: {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  vehicleInfo?: string;
  memberCount?: number;
  hotelInfo?: string;
}) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const existing = await prisma.tourTravelItinerary.findFirst({
    where: { id: input.id, eventId: input.eventId },
  });
  if (!existing) return { error: "Itinerary not found" };

  await prisma.tourTravelItinerary.update({
    where: { id: input.id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      vehicleInfo: input.vehicleInfo?.trim() || null,
      memberCount: input.memberCount ?? null,
      hotelInfo: input.hotelInfo?.trim() || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function addTourTravelDay(input: z.infer<typeof daySchema>) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = daySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const itinerary = await prisma.tourTravelItinerary.findUnique({
    where: { id: parsed.data.itineraryId },
  });
  if (!itinerary) return { error: "Itinerary not found" };

  const day = await prisma.tourTravelDay.create({
    data: {
      itineraryId: parsed.data.itineraryId,
      dayIndex: parsed.data.dayIndex,
      dayDate: parsed.data.dayDate ? new Date(parsed.data.dayDate) : null,
      title: parsed.data.title?.trim() || null,
    },
  });

  revalidatePath("/admin");
  return { dayId: day.id };
}

export async function addTourTravelStop(input: z.infer<typeof stopSchema>) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = stopSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const day = await prisma.tourTravelDay.findUnique({
    where: { id: parsed.data.dayId },
    include: { itinerary: true },
  });
  if (!day) return { error: "Day not found" };

  const count = await prisma.tourTravelStop.count({ where: { dayId: day.id } });

  await prisma.tourTravelStop.create({
    data: {
      dayId: day.id,
      stopType: parsed.data.stopType as TourTravelStopType,
      title: parsed.data.title.trim(),
      location: parsed.data.location?.trim() || null,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      notes: parsed.data.notes?.trim() || null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function deleteTourTravelStop(stopId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const stop = await prisma.tourTravelStop.findUnique({
    where: { id: stopId },
    include: { day: { include: { itinerary: true } } },
  });
  if (!stop || stop.day.itinerary.eventId !== eventId) return { error: "Stop not found" };

  await prisma.tourTravelStop.delete({ where: { id: stopId } });
  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function publishTourTravelItinerary(itineraryId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const itinerary = await prisma.tourTravelItinerary.findFirst({
    where: { id: itineraryId, eventId },
  });
  if (!itinerary) return { error: "Itinerary not found" };

  await prisma.tourTravelItinerary.update({
    where: { id: itineraryId },
    data: { isPublished: true, publishedAt: new Date() },
  });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } });
  const notifyResult = await notifyTourTravelSelectedExhibitors({
    eventId,
    title: "Tour & travel itinerary updated",
    message: `${event?.title ?? "Your event"}: "${itinerary.title}" schedule is now available. Open Schedules for day-by-day details.`,
    link: "/exhibitor?tab=schedules",
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true as const, count: notifyResult.count };
}

export async function notifyExhibitorsOfEventSchedule(eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } });
  if (!event) return { error: "Event not found" };

  const result = await notifyEventExhibitorUsers({
    eventId,
    title: "Event schedule updated",
    message: `${event.title}: the event day schedule has been updated. Check Schedules for the latest timings.`,
    link: "/exhibitor?tab=schedules",
  });

  return { success: true as const, count: result.count };
}

export async function importTourTravelFromUpload(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");
  const replaceItineraryId = String(formData.get("replaceItineraryId") ?? "").trim() || null;

  if (!eventId) return { error: "Event is required" };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel or CSV file to upload" };

  const { isAcceptedScheduleFileName, parseTourTravelUpload } = await import(
    "@/lib/schedule-upload-parser"
  );
  if (!isAcceptedScheduleFileName(file.name)) {
    return { error: "Upload a .xlsx, .xls, or .csv file" };
  }

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseTourTravelUpload(buffer, file.name);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not read the uploaded schedule file",
    };
  }

  const event = await prisma.event.findFirst({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  let targetId: string;

  if (replaceItineraryId) {
    const existing = await prisma.tourTravelItinerary.findFirst({
      where: { id: replaceItineraryId, eventId },
    });
    if (!existing) return { error: "Selected trip was not found" };

    await prisma.tourTravelDay.deleteMany({ where: { itineraryId: replaceItineraryId } });
    await prisma.tourTravelItinerary.update({
      where: { id: replaceItineraryId },
      data: {
        title: parsed.title,
        description: parsed.description,
        vehicleInfo: parsed.vehicleInfo,
        memberCount: parsed.memberCount,
        hotelInfo: parsed.hotelInfo,
        isPublished: false,
        publishedAt: null,
      },
    });
    targetId = replaceItineraryId;
  } else {
    const created = await prisma.tourTravelItinerary.create({
      data: {
        eventId,
        title: parsed.title,
        description: parsed.description,
        vehicleInfo: parsed.vehicleInfo,
        memberCount: parsed.memberCount,
        hotelInfo: parsed.hotelInfo,
      },
    });
    targetId = created.id;
  }

  for (const day of parsed.days) {
    const dayRow = await prisma.tourTravelDay.create({
      data: {
        itineraryId: targetId,
        dayIndex: day.dayIndex,
        dayDate: day.dayDate,
        title: day.title,
      },
    });

    if (day.stops.length > 0) {
      await prisma.tourTravelStop.createMany({
        data: day.stops.map((stop) => ({
          dayId: dayRow.id,
          stopType: stop.stopType,
          title: stop.title,
          location: stop.location,
          startAt: stop.startAt,
          endAt: stop.endAt,
          notes: stop.notes,
          sortOrder: stop.sortOrder,
        })),
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  const stopCount = parsed.days.reduce((total, day) => total + day.stops.length, 0);
  return {
    success: true as const,
    itineraryId: targetId,
    message: `Imported "${parsed.title}" with ${parsed.days.length} days and ${stopCount} stops`,
  };
}

export async function importEventScheduleFromUpload(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");

  if (!eventId) return { error: "Event is required" };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel or CSV file to upload" };

  const { isAcceptedScheduleFileName, parseEventScheduleUpload } = await import(
    "@/lib/schedule-upload-parser"
  );
  if (!isAcceptedScheduleFileName(file.name)) {
    return { error: "Upload a .xlsx, .xls, or .csv file" };
  }

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseEventScheduleUpload(buffer, file.name);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not read the uploaded schedule file",
    };
  }

  const event = await prisma.event.findFirst({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  const existingCount = await prisma.eventScheduleItem.count({ where: { eventId } });

  if (parsed.items.length > 0) {
    await prisma.eventScheduleItem.createMany({
      data: parsed.items.map((item, index) => ({
        eventId,
        title: item.title,
        description: item.description,
        startAt: item.startAt,
        endAt: item.endAt,
        location: item.location,
        sortOrder: existingCount + index,
        isActive: true,
      })),
    });
  }

  await notifyEventExhibitorUsers({
    eventId,
    title: "Event schedule updated",
    message: `${event.title}: ${parsed.items.length} schedule item${parsed.items.length === 1 ? "" : "s"} imported from ${file.name}.`,
    link: "/exhibitor?tab=schedules",
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return {
    success: true as const,
    message: `Imported ${parsed.items.length} event schedule item${parsed.items.length === 1 ? "" : "s"}`,
  };
}
