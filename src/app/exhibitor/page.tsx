import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess, canManageMembers } from "@/lib/exhibitor";
import type { EventActivityOption } from "@/lib/event-activity-types";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { getOpenExhibitorEvents } from "@/lib/exhibitor-events";
import { prisma } from "@/lib/prisma";
import { listAirBookingRequestsForExhibitor } from "@/lib/air-booking-actions";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import ExhibitorPortalDashboard from "@/components/exhibitor-portal/exhibitor-portal-dashboard";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { differenceInCalendarDays } from "date-fns";

export const dynamic = "force-dynamic";

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

const eventExhibitorInclude = {
  registration: true,
  event: {
    include: {
      venue: { select: { name: true, city: true } },
    },
  },
} as const;

export default async function ExhibitorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/exhibitor?mode=signin");

  const access = await requireExhibitorAccess(user.id);
  if (!access?.membership) redirect("/auth/exhibitor?mode=signup");

  const primaryEvent = await getPrimaryPublishedEvent();
  const openEvents = await getOpenExhibitorEvents();

  let eventEntry = primaryEvent
    ? await prisma.eventExhibitor.findFirst({
        where: {
          exhibitorId: access.exhibitor.id,
          eventId: primaryEvent.id,
        },
        include: eventExhibitorInclude,
      })
    : null;

  if (!eventEntry) {
    eventEntry = await prisma.eventExhibitor.findFirst({
      where: { exhibitorId: access.exhibitor.id },
      orderBy: { event: { startDate: "asc" } },
      include: eventExhibitorInclude,
    });
  }

  const event = eventEntry?.event ?? primaryEvent;
  const expoDays = event
    ? Math.max(1, differenceInCalendarDays(event.endDate, event.startDate) + 1)
    : 1;

  const activities = event
    ? await prisma.eventActivity.findMany({
        where: { eventId: event.id, isActive: true },
        orderBy: { startAt: "asc" },
      })
    : [];

  const savedRegistration = eventEntry?.registration?.formData
    ? (eventEntry.registration.formData as SavedRegistrationData)
    : null;

  const memberDocuments: SerializedMemberDocument[] = eventEntry
    ? (
        await prisma.exhibitorMemberDocument.findMany({
          where: { eventExhibitorId: eventEntry.id },
          orderBy: { createdAt: "desc" },
        })
      ).map((doc) => ({
        id: doc.id,
        eventExhibitorId: doc.eventExhibitorId,
        memberLocalId: doc.memberLocalId,
        documentType: doc.documentType,
        originalFileName: doc.originalFileName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.createdAt.toISOString(),
      }))
    : [];

  let airBookingRequests: SerializedAirBookingRequest[] = [];
  if (eventEntry) {
    const airBookingResult = await listAirBookingRequestsForExhibitor(eventEntry.id);
    if (airBookingResult.success && airBookingResult.requests) {
      airBookingRequests = airBookingResult.requests;
    }
  }

  return (
    <ExhibitorPortalDashboard
      eventExhibitorId={eventEntry?.id ?? null}
      savedRegistration={savedRegistration}
      registrationStatus={eventEntry?.registration?.status ?? null}
      companyName={access.exhibitor.companyName}
      contactName={access.exhibitor.contactName || user.name || ""}
      contactEmail={access.exhibitor.contactEmail || user.email}
      contactPhone={access.exhibitor.contactPhone}
      description={access.exhibitor.description}
      eventTitle={event?.title ?? "Upcoming event"}
      eventVenue={event?.venue?.name ?? "Venue TBC"}
      eventCity={event?.venue?.city ?? "Kenya"}
      startDate={(event?.startDate ?? new Date()).toISOString()}
      endDate={(event?.endDate ?? new Date()).toISOString()}
      boothNumber={eventEntry?.boothNumber ?? null}
      hall={eventEntry?.hall ?? null}
      expoDays={expoDays}
      eventActivities={activities.map(serializeActivity)}
      canManageMembers={canManageMembers(access.membership.role)}
      openEvents={openEvents}
      memberDocuments={memberDocuments}
      airBookingRequests={airBookingRequests}
    />
  );
}
