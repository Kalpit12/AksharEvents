"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { notifyEventExhibitorUsers } from "@/lib/notification-actions";
import { prisma } from "@/lib/prisma";
import {
  createEventHotelSchema,
  createEventItemMasterSchema,
  updateEventItemMasterSchema,
  createEventRestaurantSchema,
  createEventScheduleItemSchema,
} from "@/lib/validations";

async function requireEventMaster() {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" as const, user: null };
  return { user, error: null };
}

function formatAgendaTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function syncPublicAgendaFromEventSchedule(eventId: string) {
  const items = await prisma.eventScheduleItem.findMany({
    where: { eventId, isActive: true },
    orderBy: { startAt: "asc" },
  });

  await prisma.agendaItem.deleteMany({ where: { eventId } });

  if (items.length === 0) return;

  await prisma.agendaItem.createMany({
    data: items.map((item, order) => ({
      eventId,
      title: item.title,
      description: item.description,
      speaker: item.speaker,
      location: item.location,
      startTime: formatAgendaTime(item.startAt),
      endTime: item.endAt ? formatAgendaTime(item.endAt) : formatAgendaTime(item.startAt),
      order,
    })),
  });
}

export async function createEventHotel(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = createEventHotelSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const event = await prisma.event.findFirst({ where: { id: parsed.data.eventId } });
  if (!event) return { error: "Event not found" };

  const count = await prisma.eventHotel.count({ where: { eventId: event.id } });

  await prisma.eventHotel.create({
    data: {
      eventId: event.id,
      name: parsed.data.name.trim(),
      location: parsed.data.location?.trim() || null,
      description: parsed.data.description?.trim() || null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}

export async function toggleEventHotel(hotelId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const hotel = await prisma.eventHotel.findFirst({
    where: { id: hotelId, eventId },
  });
  if (!hotel) return { error: "Hotel not found" };

  await prisma.eventHotel.update({
    where: { id: hotelId },
    data: { isActive: !hotel.isActive },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}

export async function createEventRestaurant(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = createEventRestaurantSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    cuisine: formData.get("cuisine") || undefined,
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const event = await prisma.event.findFirst({ where: { id: parsed.data.eventId } });
  if (!event) return { error: "Event not found" };

  const count = await prisma.eventRestaurant.count({ where: { eventId: event.id } });

  await prisma.eventRestaurant.create({
    data: {
      eventId: event.id,
      name: parsed.data.name.trim(),
      cuisine: parsed.data.cuisine?.trim() || null,
      location: parsed.data.location?.trim() || null,
      description: parsed.data.description?.trim() || null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}

export async function toggleEventRestaurant(restaurantId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const restaurant = await prisma.eventRestaurant.findFirst({
    where: { id: restaurantId, eventId },
  });
  if (!restaurant) return { error: "Restaurant not found" };

  await prisma.eventRestaurant.update({
    where: { id: restaurantId },
    data: { isActive: !restaurant.isActive },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}

export async function createEventScheduleItem(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = createEventScheduleItemSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    speaker: formData.get("speaker") || undefined,
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const event = await prisma.event.findFirst({ where: { id: parsed.data.eventId } });
  if (!event) return { error: "Event not found" };

  const count = await prisma.eventScheduleItem.count({ where: { eventId: event.id } });

  await prisma.eventScheduleItem.create({
    data: {
      eventId: event.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      speaker: parsed.data.speaker?.trim() || null,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      location: parsed.data.location?.trim() || null,
      sortOrder: count,
    },
  });

  await syncPublicAgendaFromEventSchedule(event.id);

  await notifyEventExhibitorUsers({
    eventId: event.id,
    title: "Event schedule updated",
    message: `${event.title}: a new schedule item "${parsed.data.title.trim()}" was added.`,
    link: "/exhibitor?tab=schedules",
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  revalidatePath("/events");
  return { success: true };
}

export async function deleteEventScheduleItem(itemId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const item = await prisma.eventScheduleItem.findFirst({
    where: { id: itemId, eventId },
  });
  if (!item) return { error: "Schedule item not found" };

  await prisma.eventScheduleItem.delete({ where: { id: itemId } });

  await syncPublicAgendaFromEventSchedule(eventId);

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  revalidatePath("/events");
  return { success: true };
}

export async function toggleEventScheduleItem(itemId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const item = await prisma.eventScheduleItem.findFirst({
    where: { id: itemId, eventId },
  });
  if (!item) return { error: "Schedule item not found" };

  await prisma.eventScheduleItem.update({
    where: { id: itemId },
    data: { isActive: !item.isActive },
  });

  await syncPublicAgendaFromEventSchedule(eventId);

  if (!item.isActive) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });
    await notifyEventExhibitorUsers({
      eventId,
      title: "Event schedule updated",
      message: `${event?.title ?? "Your event"}: "${item.title}" is now on the published schedule.`,
      link: "/exhibitor?tab=schedules",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  revalidatePath("/events");
  return { success: true };
}

export async function createEventItemMaster(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = createEventItemMasterSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    category: formData.get("category"),
    unitOfMeasure: formData.get("unitOfMeasure"),
    unitCost: formData.get("unitCost"),
    currency: formData.get("currency") || "KES",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const event = await prisma.event.findFirst({ where: { id: parsed.data.eventId } });
  if (!event) return { error: "Event not found" };

  const count = await prisma.eventItemMaster.count({ where: { eventId: event.id } });

  await prisma.eventItemMaster.create({
    data: {
      eventId: event.id,
      name: parsed.data.name.trim(),
      category: parsed.data.category.trim(),
      unitOfMeasure: parsed.data.unitOfMeasure.trim(),
      unitCost: parsed.data.unitCost,
      currency: parsed.data.currency,
      sortOrder: count,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateEventItemMaster(formData: FormData) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const parsed = updateEventItemMasterSchema.safeParse({
    itemId: formData.get("itemId"),
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    category: formData.get("category"),
    unitOfMeasure: formData.get("unitOfMeasure"),
    unitCost: formData.get("unitCost"),
    currency: formData.get("currency") || "KES",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const item = await prisma.eventItemMaster.findFirst({
    where: { id: parsed.data.itemId, eventId: parsed.data.eventId },
  });
  if (!item) return { error: "Item not found" };

  await prisma.eventItemMaster.update({
    where: { id: parsed.data.itemId },
    data: {
      name: parsed.data.name.trim(),
      category: parsed.data.category.trim(),
      unitOfMeasure: parsed.data.unitOfMeasure.trim(),
      unitCost: parsed.data.unitCost,
      currency: parsed.data.currency,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}

export async function deleteEventItemMaster(itemId: string, eventId: string) {
  const auth = await requireEventMaster();
  if (auth.error) return { error: auth.error };

  const item = await prisma.eventItemMaster.findFirst({
    where: { id: itemId, eventId },
  });
  if (!item) return { error: "Item not found" };

  await prisma.eventItemMaster.delete({ where: { id: itemId } });

  revalidatePath("/admin");
  return { success: true };
}
