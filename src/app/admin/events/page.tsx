import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminEventsPanel from "@/components/admin/admin-events-panel";
import { EventMasterPageHero, EventMasterQuickNav } from "@/components/event-master/event-master-ui";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const [categories, venues, events] = await Promise.all([
    prisma.eventCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.venue.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
    prisma.event.findMany({
      orderBy: { startDate: "desc" },
      include: { venue: { select: { city: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <EventMasterPageHero
        title="Events"
        subtitle="Create and publish expos. Published events appear in the exhibitor signup form."
        createHref="#create-event"
      />

      <EventMasterQuickNav active="events" />

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
