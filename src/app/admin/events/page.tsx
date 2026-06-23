import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminEventsPanel from "@/components/admin/admin-events-panel";

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Event Master</p>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and publish expos. Exhibitors choose an event when they sign up.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>

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
