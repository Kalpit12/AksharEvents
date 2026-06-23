import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma } from "@/lib/prisma";
import EventMasterDashboard from "@/components/event-master/event-master-dashboard";

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
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h1 className="text-xl font-semibold">Event Master</h1>
          <p className="mt-2 text-sm text-muted-foreground">No published events yet.</p>
          <a href="/admin/events" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Create your first event →
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
        eventTitle={event.title}
        eventLocation={location}
        startDate={event.startDate.toISOString()}
        endDate={event.endDate.toISOString()}
        exhibitors={exhibitors}
        activities={activities.map(serializeActivity)}
      />
    </div>
  );
}
