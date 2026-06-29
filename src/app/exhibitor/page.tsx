import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess, canManageMembers } from "@/lib/exhibitor";
import { loadExhibitorDashboardPageDataWithRetry } from "@/lib/exhibitor-page-data";
import ExhibitorPortalDashboard from "@/components/exhibitor-portal/exhibitor-portal-dashboard";

export const dynamic = "force-dynamic";

export default async function ExhibitorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/exhibitor?mode=signin");

  const access = await requireExhibitorAccess(user.id);
  if (!access?.membership) redirect("/auth/exhibitor?mode=signup");

  const data = await loadExhibitorDashboardPageDataWithRetry(
    access.exhibitor,
    access.membership.role
  );

  return (
    <Suspense
      fallback={
        <div
          className="mx-auto h-96 max-w-7xl animate-pulse rounded-2xl border border-border bg-muted/40 px-4 py-6 sm:px-6 lg:px-8"
          aria-hidden
        />
      }
    >
      <ExhibitorPortalDashboard
        eventExhibitorId={data.eventExhibitorId}
        savedRegistration={data.savedRegistration}
        registrationStatus={data.registrationStatus}
        companyName={data.exhibitor.companyName}
        contactName={data.exhibitor.contactName || user.name || ""}
        contactEmail={data.exhibitor.contactEmail || user.email}
        contactPhone={data.exhibitor.contactPhone}
        description={data.exhibitor.description}
        eventTitle={data.eventTitle}
        eventVenue={data.eventVenue}
        eventCity={data.eventCity}
        startDate={data.startDate}
        endDate={data.endDate}
        boothNumber={data.boothNumber}
        hall={data.hall}
        expoDays={data.expoDays}
        eventActivities={data.eventActivities}
        eventHotels={data.eventHotels}
        eventRestaurants={data.eventRestaurants}
        eventSchedule={data.eventSchedule}
        itemCatalog={data.itemCatalog}
        canManageMembers={canManageMembers(data.membershipRole)}
        openEvents={data.openEvents}
        memberDocuments={data.memberDocuments}
        airBookingRequests={data.airBookingRequests}
        memberWorkflows={data.memberWorkflows}
      />
    </Suspense>
  );
}
