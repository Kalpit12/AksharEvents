"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEventHotelSchema,
  createEventRestaurantSchema,
  createEventScheduleItemSchema,
} from "@/lib/validations";

async function requireEventMaster() {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" as const, user: null };
  return { user, error: null };
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
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      location: parsed.data.location?.trim() || null,
      sortOrder: count,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
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

  revalidatePath("/admin");
  revalidatePath("/exhibitor");
  return { success: true };
}
