"use server";

import { revalidatePath } from "next/cache";
import { prisma, withDbRetry, isTransientConnectionError } from "@/lib/prisma";
import {
  addExhibitorMemberSchema,
  bookActivitySchema,
  createActivitySchema,
  itineraryItemSchema,
} from "@/lib/validations";
import {
  canManageMembers,
  getEventExhibitorForUser,
  requireExhibitorAccess,
} from "@/lib/exhibitor";
import { getCurrentUser, requireRole } from "@/lib/auth";
import type { ActivityKind, ExhibitorRegistrationStatus, ItineraryItemKind, Prisma } from "@prisma/client";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";

function activityToItineraryKind(kind: ActivityKind): ItineraryItemKind {
  return kind === "TOUR" ? "TOUR" : "TRAVEL";
}

export async function getExhibitorRegistration(eventExhibitorId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const access = await requireExhibitorAccess(user.id);
  if (!access) return { error: "No exhibitor access" };

  const eventExhibitor = await prisma.eventExhibitor.findFirst({
    where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
    include: { registration: true },
  });
  if (!eventExhibitor) return { error: "Event registration not found" };

  if (!eventExhibitor.registration) {
    return { success: true, data: null, status: null as ExhibitorRegistrationStatus | null };
  }

  return {
    success: true,
    data: eventExhibitor.registration.formData as SavedRegistrationData,
    status: eventExhibitor.registration.status,
    submittedAt: eventExhibitor.registration.submittedAt,
  };
}

export async function saveExhibitorRegistration(
  eventExhibitorId: string,
  payload: SavedRegistrationData,
  status: ExhibitorRegistrationStatus = "DRAFT"
) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const access = await requireExhibitorAccess(user.id);
  if (!access) return { error: "No exhibitor access" };

  try {
    const effectiveStatus = await withDbRetry(async () => {
      const eventExhibitor = await prisma.eventExhibitor.findFirst({
        where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
        include: { registration: true },
      });
      if (!eventExhibitor) throw new Error("Event registration not found");

      const existing = eventExhibitor.registration;
      const resolvedStatus =
        existing?.status === "SUBMITTED" && status === "DRAFT" ? "SUBMITTED" : status;

      const formData = payload as unknown as Prisma.InputJsonValue;

      await prisma.exhibitorRegistration.upsert({
        where: { eventExhibitorId },
        create: {
          eventExhibitorId,
          status: resolvedStatus,
          formData,
          submittedAt: resolvedStatus === "SUBMITTED" ? new Date() : null,
        },
        update: {
          status: resolvedStatus,
          formData,
          ...(resolvedStatus === "SUBMITTED"
            ? { submittedAt: existing?.submittedAt ?? new Date() }
            : {}),
        },
      });

      await prisma.exhibitor.update({
        where: { id: access.exhibitor.id },
        data: {
          companyName: payload.form.company.trim() || access.exhibitor.companyName,
          contactName: payload.form.contact.trim() || access.exhibitor.contactName,
          contactEmail: payload.form.email.trim() || access.exhibitor.contactEmail,
          contactPhone: payload.form.phone.trim() || access.exhibitor.contactPhone,
          description: payload.form.desc.trim() || access.exhibitor.description,
        },
      });

      return resolvedStatus;
    });

    if (effectiveStatus === "SUBMITTED") {
      revalidatePath("/exhibitor");
      revalidatePath("/admin");
    } else {
      revalidatePath("/exhibitor");
      revalidatePath("/admin");
    }
    return { success: true, status: effectiveStatus };
  } catch (error) {
    console.error("saveExhibitorRegistration failed:", error);
    if (isTransientConnectionError(error)) {
      return { error: "Database connection lost. Please wait a moment and try again." };
    }
    if (error instanceof Error && error.message === "Event registration not found") {
      return { error: error.message };
    }
    return { error: "Failed to save registration. Please try again." };
  }
}

export async function addExhibitorMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const access = await requireExhibitorAccess(user.id);
  if (!access?.membership) return { error: "No exhibitor company found" };

  const role = access.membership.role;
  if (!canManageMembers(role)) {
    return { error: "Only owners and admins can add members" };
  }

  const parsed = addExhibitorMemberSchema.safeParse({
    email: formData.get("email"),
    memberRole: formData.get("memberRole"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!invitee) {
    return { error: "No account found with that email. They must register first." };
  }

  if (invitee.id === user.id) {
    return { error: "You are already a member of this company" };
  }

  const existingOwner = access.exhibitor.userId === invitee.id;
  const existingMember = await prisma.exhibitorMember.findUnique({
    where: {
      exhibitorId_userId: {
        exhibitorId: access.exhibitor.id,
        userId: invitee.id,
      },
    },
  });
  if (existingOwner || existingMember) {
    return { error: "This user is already a member" };
  }

  await prisma.exhibitorMember.create({
    data: {
      exhibitorId: access.exhibitor.id,
      userId: invitee.id,
      role: parsed.data.memberRole,
    },
  });

  revalidatePath("/exhibitor/members");
  return { success: true };
}

export async function removeExhibitorMember(memberId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const access = await requireExhibitorAccess(user.id);
  if (!access?.membership || !canManageMembers(access.membership.role)) {
    return { error: "Not authorized" };
  }

  const member = await prisma.exhibitorMember.findFirst({
    where: { id: memberId, exhibitorId: access.exhibitor.id },
  });
  if (!member) return { error: "Member not found" };
  if (member.role === "OWNER") return { error: "Cannot remove the company owner" };

  await prisma.exhibitorMember.delete({ where: { id: memberId } });
  revalidatePath("/exhibitor/members");
  return { success: true };
}

export async function bookEventActivity(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = bookActivitySchema.safeParse({
    activityId: formData.get("activityId"),
    eventSlug: formData.get("eventSlug"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const context = await getEventExhibitorForUser(user.id, parsed.data.eventSlug);
  if (!context?.eventExhibitor) {
    return { error: "You are not exhibiting at this event" };
  }

  const activity = await prisma.eventActivity.findFirst({
    where: {
      id: parsed.data.activityId,
      eventId: context.eventExhibitor.event.id,
      isActive: true,
    },
    include: { _count: { select: { bookings: true } } },
  });
  if (!activity) return { error: "Tour or travel option not found" };

  if (activity.maxSlots && activity._count.bookings >= activity.maxSlots) {
    return { error: "This option is fully booked" };
  }

  const existing = await prisma.exhibitorActivityBooking.findUnique({
    where: {
      activityId_exhibitorId: {
        activityId: activity.id,
        exhibitorId: context.exhibitor.id,
      },
    },
  });
  if (existing) return { error: "Your company has already booked this" };

  await prisma.$transaction(async (tx) => {
    const booking = await tx.exhibitorActivityBooking.create({
      data: {
        activityId: activity.id,
        exhibitorId: context.exhibitor.id,
        bookedById: user.id,
        notes: parsed.data.notes?.trim() || null,
      },
    });

    await tx.itineraryItem.create({
      data: {
        eventExhibitorId: context.eventExhibitor.id,
        title: activity.title,
        kind: activityToItineraryKind(activity.kind),
        startAt: activity.startAt,
        endAt: activity.endAt,
        location: activity.location,
        activityBookingId: booking.id,
      },
    });
  });

  revalidatePath(`/exhibitor/events/${parsed.data.eventSlug}`);
  return { success: true };
}

export async function addItineraryItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = itineraryItemSchema.safeParse({
    eventSlug: formData.get("eventSlug"),
    title: formData.get("title"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
    assignedMemberId: formData.get("assignedMemberId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const context = await getEventExhibitorForUser(user.id, parsed.data.eventSlug);
  if (!context?.eventExhibitor) {
    return { error: "You are not exhibiting at this event" };
  }

  if (parsed.data.assignedMemberId) {
    const member = await prisma.exhibitorMember.findFirst({
      where: {
        id: parsed.data.assignedMemberId,
        exhibitorId: context.exhibitor.id,
      },
    });
    if (!member) return { error: "Invalid team member" };
  }

  await prisma.itineraryItem.create({
    data: {
      eventExhibitorId: context.eventExhibitor.id,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      kind: "CUSTOM",
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      location: parsed.data.location?.trim() || null,
      assignedMemberId: parsed.data.assignedMemberId || null,
    },
  });

  revalidatePath(`/exhibitor/events/${parsed.data.eventSlug}`);
  return { success: true };
}

export async function deleteItineraryItem(itemId: string, eventSlug: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const context = await getEventExhibitorForUser(user.id, eventSlug);
  if (!context?.eventExhibitor) return { error: "Not authorized" };

  const item = await prisma.itineraryItem.findFirst({
    where: {
      id: itemId,
      eventExhibitorId: context.eventExhibitor.id,
    },
    include: { activityBooking: true },
  });
  if (!item) return { error: "Item not found" };

  if (item.activityBooking) {
    await prisma.$transaction([
      prisma.itineraryItem.delete({ where: { id: itemId } }),
      prisma.exhibitorActivityBooking.delete({
        where: { id: item.activityBooking.id },
      }),
    ]);
  } else {
    await prisma.itineraryItem.delete({ where: { id: itemId } });
  }

  revalidatePath(`/exhibitor/events/${eventSlug}`);
  return { success: true };
}

export async function createEventActivity(formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Event Master access required" };

  const parsed = createActivitySchema.safeParse({
    eventId: formData.get("eventId"),
    kind: formData.get("kind"),
    travelType: formData.get("travelType") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
    location: formData.get("location") || undefined,
    maxSlots: formData.get("maxSlots") || undefined,
    price: formData.get("price") || "0",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.eventId },
  });
  if (!event) return { error: "Event not found" };

  await prisma.eventActivity.create({
    data: {
      eventId: event.id,
      createdById: user.id,
      kind: parsed.data.kind,
      travelType: parsed.data.kind === "TRAVEL" ? parsed.data.travelType ?? "OTHER" : null,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      location: parsed.data.location?.trim() || null,
      maxSlots: parsed.data.maxSlots ?? null,
      price: parsed.data.price,
    },
  });

  revalidatePath(`/admin/events/${event.id}/activities`);
  return { success: true };
}

export async function toggleEventActivity(activityId: string, eventId: string) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Not authorized" };

  const activity = await prisma.eventActivity.findFirst({
    where: { id: activityId, eventId },
  });
  if (!activity) return { error: "Activity not found" };

  await prisma.eventActivity.update({
    where: { id: activityId },
    data: { isActive: !activity.isActive },
  });

  revalidatePath(`/admin/events/${eventId}/activities`);
  return { success: true };
}
