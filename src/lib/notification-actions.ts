"use server";

import { revalidatePath } from "next/cache";
import type { NotificationType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { exhibitorHasToursAndTravelsSelection } from "@/lib/tour-travel-exhibitor-selection";
import { prisma } from "@/lib/prisma";

export type SerializedNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function getUserNotifications(limit = 30) {
  const user = await getCurrentUser();
  if (!user) return { notifications: [] as SerializedNotification[], unreadCount: 0 };

  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return {
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function clearAllNotifications() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/exhibitor");
  return { success: true as const };
}

export async function notifyEventExhibitorUsers(input: {
  eventId: string;
  title: string;
  message: string;
  link?: string;
  type?: NotificationType;
}) {
  const entries = await prisma.eventExhibitor.findMany({
    where: { eventId: input.eventId },
    include: {
      exhibitor: {
        include: {
          members: { select: { userId: true } },
        },
      },
    },
  });

  const userIds = new Set<string>();
  for (const entry of entries) {
    if (entry.exhibitor.userId) userIds.add(entry.exhibitor.userId);
    for (const member of entry.exhibitor.members) userIds.add(member.userId);
  }

  if (userIds.size === 0) return { count: 0 };

  await prisma.notification.createMany({
    data: [...userIds].map((userId) => ({
      userId,
      type: input.type ?? "ITINERARY_UPDATE",
      title: input.title,
      message: input.message,
      link: input.link ?? "/exhibitor?tab=schedules",
    })),
  });

  return { count: userIds.size };
}

export async function notifyTourTravelSelectedExhibitors(input: {
  eventId: string;
  title: string;
  message: string;
  link?: string;
  type?: NotificationType;
}) {
  const entries = await prisma.eventExhibitor.findMany({
    where: { eventId: input.eventId },
    include: {
      exhibitor: {
        include: {
          members: { select: { userId: true } },
        },
      },
      registration: true,
    },
  });

  const userIds = new Set<string>();
  for (const entry of entries) {
    const formData = entry.registration?.formData
      ? (entry.registration.formData as SavedRegistrationData)
      : null;
    if (!exhibitorHasToursAndTravelsSelection(formData)) continue;

    if (entry.exhibitor.userId) userIds.add(entry.exhibitor.userId);
    for (const member of entry.exhibitor.members) userIds.add(member.userId);
  }

  if (userIds.size === 0) return { count: 0 };

  await prisma.notification.createMany({
    data: [...userIds].map((userId) => ({
      userId,
      type: input.type ?? "ITINERARY_UPDATE",
      title: input.title,
      message: input.message,
      link: input.link ?? "/exhibitor?tab=schedules",
    })),
  });

  return { count: userIds.size };
}
