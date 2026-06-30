import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import {
  serializeEventHotel,
  serializeEventItemMaster,
  serializeEventRestaurant,
  serializeEventScheduleItem,
} from "@/lib/event-config-types";
import { getPrimaryPublishedEvent } from "@/lib/primary-event";
import { prisma } from "@/lib/prisma";
import { getFlightBookingAgentEmail } from "@/lib/flight-booking-config";
import { getEventFloorPlanBooths } from "@/lib/floor-plan-actions";
import { FLOOR_PLAN_IMAGE, FLOOR_PLAN_VIEWBOX } from "@/lib/floor-plan-layout";
import type { EventFloorPlanConfig } from "@/lib/floor-plan-types";
import EventMasterDashboard from "@/components/event-master/event-master-dashboard";
import { EventMasterPageHero } from "@/components/event-master/event-master-ui";
import { cn } from "@/lib/utils";

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

export default async function AdminEventMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const { tab: urlTab } = await searchParams;
  const isFloorPlan = urlTab === "floorplan";

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

  const [
    eventExhibitors,
    activities,
    eventHotels,
    eventRestaurants,
    scheduleItems,
    itemMasterRows,
    floorPlanResult,
  ] = await Promise.all([
    prisma.eventExhibitor.findMany({
      where: { eventId: event.id },
      include: {
        exhibitor: true,
        registration: true,
      },
      orderBy: { exhibitor: { companyName: "asc" } },
    }),
    prisma.eventActivity.findMany({
      where: { eventId: event.id, isActive: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.eventHotel.findMany({
      where: { eventId: event.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.eventRestaurant.findMany({
      where: { eventId: event.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.eventScheduleItem.findMany({
      where: { eventId: event.id },
      orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.eventItemMaster.findMany({
      where: { eventId: event.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    getEventFloorPlanBooths(event.id),
  ]);

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

  const defaultFloorPlan: EventFloorPlanConfig = {
    imageUrl: FLOOR_PLAN_IMAGE,
    svgUrl: null,
    viewBox: { ...FLOOR_PLAN_VIEWBOX },
    isCustom: false,
  };

  return (
    <div
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        isFloorPlan ? "max-w-[100rem] py-3" : "max-w-7xl py-6"
      )}
    >
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-muted/40" aria-hidden />
        }
      >
        <EventMasterDashboard
        eventId={event.id}
        eventTitle={event.title}
        eventLocation={location}
        startDate={event.startDate.toISOString()}
        endDate={event.endDate.toISOString()}
        exhibitors={exhibitors}
        floorPlanBooths={floorPlanResult.booths ?? []}
        floorPlan={floorPlanResult.floorPlan ?? defaultFloorPlan}
        activities={activities.map(serializeActivity)}
        eventHotels={eventHotels.map(serializeEventHotel)}
        eventRestaurants={eventRestaurants.map(serializeEventRestaurant)}
        scheduleItems={scheduleItems.map(serializeEventScheduleItem)}
        itemMaster={itemMasterRows.map(serializeEventItemMaster)}
        flightBookingAgentEmail={getFlightBookingAgentEmail()}
        flightBookingCcEmail={
          process.env.FLIGHT_BOOKING_CC_EMAIL ?? process.env.POSTMARK_SENDER_EMAIL ?? ""
        }
        />
      </Suspense>
    </div>
  );
}
