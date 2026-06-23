"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { EventStatus } from "@prisma/client";

async function uniqueEventSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;

  while (await prisma.event.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }

  return slug;
}

export async function createAdminEvent(formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    venueId: formData.get("venueId") || undefined,
    format: formData.get("format"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    capacity: formData.get("capacity") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const publish = formData.get("publish") === "true";
  const slug = await uniqueEventSlug(parsed.data.title);

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription?.trim() || null,
      status: publish ? "PUBLISHED" : "DRAFT",
      format: parsed.data.format,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      startTime: parsed.data.startTime?.trim() || null,
      endTime: parsed.data.endTime?.trim() || null,
      capacity: parsed.data.capacity ?? null,
      categoryId: parsed.data.categoryId,
      venueId: parsed.data.venueId || null,
      organizerId: user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/auth/exhibitor");
  revalidatePath("/exhibitor");

  return { success: true, eventId: event.id, slug: event.slug };
}

export async function setAdminEventStatus(eventId: string, status: EventStatus) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/auth/exhibitor");
  revalidatePath("/exhibitor");

  return { success: true };
}
