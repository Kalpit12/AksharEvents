import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { OrganizerActivitiesPanel } from "@/app/admin/events/[eventId]/activities/activities-panel";
import { ArrowLeft } from "lucide-react";

export default async function AdminEventActivitiesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    select: { id: true, title: true },
  });
  if (!event) notFound();

  const activities = await prisma.eventActivity.findMany({
    where: { eventId: event.id },
    include: { _count: { select: { bookings: true } } },
    orderBy: { startAt: "asc" },
  });

  const serialized = activities.map((activity) => ({
    ...activity,
    startAt: activity.startAt.toISOString(),
    endAt: activity.endAt?.toISOString() ?? null,
    price: activity.price.toString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4" /> Back to Event Master
        </Link>
      </Button>
      <OrganizerActivitiesPanel
        eventId={event.id}
        eventTitle={event.title}
        activities={serialized}
      />
    </div>
  );
}
