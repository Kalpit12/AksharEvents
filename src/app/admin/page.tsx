import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma } from "@/lib/prisma";
import { listAirBookingRequestsForEvent } from "@/lib/air-booking-actions";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import EventMasterDashboard from "@/components/event-master/event-master-dashboard";
import { EventMasterPageHero } from "@/components/event-master/event-master-ui";

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

export default async function AdminEventMasterPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const event = await getPrimaryPublishedEvent();

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <EventMasterPageHero
          title="No published events yet"
          subtitle="Create and publish an expo so exhibitors can sign up and you can manage registrations from this dashboard."
          showCreateAction
        />
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Once you publish an event, exhibitor registrations, transport, hotels, and food data will appear here.
          </p>
          <a
            href="/admin/events"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-champagne-dark"
          >
            Go to Create event →
          </a>
        </div>
      </div>
    );
  }

  const location = event.venue?.city ?? "Kenya";

  const eventExhibitors = await prisma.eventExhibitor.findMany({
    where: { eventId: event.id },
    include: {
      exhibitor: true,
      registration: true,
    },
    orderBy: { exhibitor: { companyName: "asc" } },
  });

  const activities = await prisma.eventActivity.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { startAt: "asc" },
  });

  const [airBookingRequests, memberDocumentRows] = await Promise.all([
    listAirBookingRequestsForEvent(event.id),
    prisma.exhibitorMemberDocument.findMany({
      where: { eventExhibitor: { eventId: event.id } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const memberDocuments: SerializedMemberDocument[] = memberDocumentRows.map((doc) => ({
    id: doc.id,
    eventExhibitorId: doc.eventExhibitorId,
    memberLocalId: doc.memberLocalId,
    documentType: doc.documentType,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    uploadedAt: doc.createdAt.toISOString(),
  }));

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <EventMasterDashboard
        eventId={event.id}
        eventTitle={event.title}
        eventLocation={location}
        startDate={event.startDate.toISOString()}
        endDate={event.endDate.toISOString()}
        exhibitors={exhibitors}
        activities={activities.map(serializeActivity)}
        airBookingRequests={airBookingRequests}
        memberDocuments={memberDocuments}
        flightBookingAgentEmail={process.env.FLIGHT_BOOKING_AGENT_EMAIL ?? ""}
        flightBookingCcEmail={
          process.env.FLIGHT_BOOKING_CC_EMAIL ?? process.env.POSTMARK_SENDER_EMAIL ?? ""
        }
      />
    </div>
  );
}
