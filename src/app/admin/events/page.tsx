import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import AdminEventsPanel from "@/components/admin/admin-events-panel";
import { EventMasterPageHero, EventMasterQuickNav } from "@/components/event-master/event-master-ui";
import { EM_SELECTED_EVENT_COOKIE } from "@/lib/em-selected-event";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const cookieStore = await cookies();
  const cookieEventId = cookieStore.get(EM_SELECTED_EVENT_COOKIE)?.value ?? null;

  const { categories, venues, events } = await withDbRetry(async () => {
    const [categories, venues, events] = await Promise.all([
      prisma.eventCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
      prisma.event.findMany({
        orderBy: { startDate: "desc" },
        include: { venue: { select: { city: true } } },
      }),
    ]);
    return { categories, venues, events };
  });

  const rememberedEventId =
    cookieEventId && events.some((e) => e.id === cookieEventId && e.status === "PUBLISHED")
      ? cookieEventId
      : undefined;

  const dashboardHref = rememberedEventId
    ? `/admin?eventId=${encodeURIComponent(rememberedEventId)}`
    : "/admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <EventMasterPageHero
        title="Events"
        subtitle="Create and publish expos. Published events appear in the exhibitor signup form."
        createHref="#create-event"
        dashboardHref={dashboardHref}
      />

      <EventMasterQuickNav active="events" eventId={rememberedEventId} />

      <AdminEventsPanel
        categories={categories}
        venues={venues}
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          slug: event.slug,
          format: event.format,
          status: event.status,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          city: event.venue?.city ?? null,
        }))}
      />
    </div>
  );
}
