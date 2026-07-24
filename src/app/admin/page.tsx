import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { loadAdminEventMasterPageDataWithRetry } from "@/lib/admin-page-data";
import { loadVisitorCheckInStatsWithRetry } from "@/lib/visitor-check-ins";
import { loadExhibitorCheckInStatsWithRetry } from "@/lib/exhibitor-check-ins";
import { getFlightBookingAgentEmail } from "@/lib/flight-booking-config";
import { prisma } from "@/lib/prisma";
import EventMasterDashboard from "@/components/event-master/event-master-dashboard";
import { EventMasterPageHero } from "@/components/event-master/event-master-ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEventMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; eventId?: string; checkinKind?: string }>;
}) {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const { tab: urlTab, eventId: urlEventId, checkinKind: urlCheckinKind } = await searchParams;
  const isFloorPlan = urlTab === "floorplan";

  const publishedEvents = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
    include: { venue: { select: { name: true, city: true } } },
  });

  const event = urlEventId
    ? (publishedEvents.find((e) => e.id === urlEventId) ?? publishedEvents[0] ?? null)
    : (publishedEvents[0] ?? null);

  const eventKioskMeta = event
    ? await prisma.event.findUnique({
        where: { id: event.id },
        select: {
          slug: true,
          boothKioskEnabled: true,
          boothKioskPasswordHash: true,
        },
      })
    : null;

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

  const location = event.venue?.city ?? event.venue?.name ?? "Kenya";
  const checkInKind = urlCheckinKind === "exhibitor" ? "exhibitor" : "visitor";
  const [data, visitorCheckIns, exhibitorCheckIns] = await Promise.all([
    loadAdminEventMasterPageDataWithRetry(event.id),
    loadVisitorCheckInStatsWithRetry(event.id),
    loadExhibitorCheckInStatsWithRetry(event.id),
  ]);

  const publishedEventOptions = publishedEvents.map((e) => ({
    id: e.id,
    title: e.title,
    location: e.venue?.city ?? e.venue?.name ?? "Kenya",
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
  }));

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
          exhibitors={data.exhibitors}
          floorPlanBooths={data.floorPlanBooths}
          floorPlan={data.floorPlan}
          boothFee={data.boothFee}
          boothFeeCurrency={data.boothFeeCurrency}
          activities={data.activities}
          eventHotels={data.eventHotels}
          eventRestaurants={data.eventRestaurants}
          scheduleItems={data.scheduleItems}
          itemMaster={data.itemMaster}
          tourTravelItineraries={data.tourTravelItineraries}
          flightBookingAgentEmail={getFlightBookingAgentEmail()}
          flightBookingCcEmail={
            process.env.FLIGHT_BOOKING_CC_EMAIL ?? process.env.POSTMARK_SENDER_EMAIL ?? ""
          }
          visitorCheckIns={visitorCheckIns}
          exhibitorCheckIns={exhibitorCheckIns}
          checkInKind={checkInKind}
          publishedEvents={publishedEventOptions}
          onsiteKiosk={{
            enabled: eventKioskMeta?.boothKioskEnabled ?? false,
            hasPassword: Boolean(eventKioskMeta?.boothKioskPasswordHash),
            slug: eventKioskMeta?.slug ?? event.slug,
          }}
        />
      </Suspense>
    </div>
  );
}
