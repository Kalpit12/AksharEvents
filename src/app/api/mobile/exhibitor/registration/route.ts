import { prisma, withDbRetry } from "@/lib/prisma";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { requireMobileUser, jsonError, jsonOk } from "@/lib/mobile-api";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { ExhibitorRegistrationStatus, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const user = await requireMobileUser(request, "ATTENDEE", "ADMIN");
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const eventExhibitorId = searchParams.get("eventExhibitorId");
  if (!eventExhibitorId) return jsonError("eventExhibitorId is required");

  const access = await requireExhibitorAccess(user.id);
  if (!access) return jsonError("No exhibitor access", 403);

  const eventExhibitor = await prisma.eventExhibitor.findFirst({
    where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
    include: { registration: true },
  });
  if (!eventExhibitor) return jsonError("Registration not found", 404);

  return jsonOk({
    data: eventExhibitor.registration?.formData ?? null,
    status: eventExhibitor.registration?.status ?? null,
    submittedAt: eventExhibitor.registration?.submittedAt?.toISOString() ?? null,
  });
}

export async function PUT(request: Request) {
  const user = await requireMobileUser(request, "ATTENDEE", "ADMIN");
  if (!user) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const { eventExhibitorId, data, status } = body as {
    eventExhibitorId: string;
    data: SavedRegistrationData;
    status?: ExhibitorRegistrationStatus;
  };

  if (!eventExhibitorId || !data) {
    return jsonError("eventExhibitorId and data are required");
  }

  const access = await requireExhibitorAccess(user.id);
  if (!access) return jsonError("No exhibitor access", 403);

  try {
    const effectiveStatus = await withDbRetry(async () => {
      const eventExhibitor = await prisma.eventExhibitor.findFirst({
        where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
        include: { registration: true },
      });
      if (!eventExhibitor) throw new Error("Event registration not found");

      const resolvedStatus: ExhibitorRegistrationStatus =
        eventExhibitor.registration?.status === "SUBMITTED" && status === "DRAFT"
          ? "SUBMITTED"
          : (status ?? "DRAFT");

      const formData = data as unknown as Prisma.InputJsonValue;

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
            ? { submittedAt: eventExhibitor.registration?.submittedAt ?? new Date() }
            : {}),
        },
      });

      await prisma.exhibitor.update({
        where: { id: access.exhibitor.id },
        data: {
          companyName: data.form.company.trim() || access.exhibitor.companyName,
          contactName: data.form.contact.trim() || access.exhibitor.contactName,
          contactEmail: data.form.email.trim() || access.exhibitor.contactEmail,
          contactPhone: data.form.phone.trim() || access.exhibitor.contactPhone,
          description: data.form.desc.trim() || access.exhibitor.description,
        },
      });

      return resolvedStatus;
    });

    return jsonOk({ success: true, status: effectiveStatus });
  } catch (error) {
    if (error instanceof Error && error.message === "Event registration not found") {
      return jsonError(error.message, 404);
    }
    return jsonError("Failed to save registration", 500);
  }
}
