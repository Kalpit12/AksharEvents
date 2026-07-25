import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import { TicketScannerClient } from "@/components/admin/ticket-scanner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { EM_SELECTED_EVENT_COOKIE } from "@/lib/em-selected-event";
import { rankPublishedEvents, resolvePublishedEventSelection } from "@/lib/primary-event";

export const metadata: Metadata = {
  title: "Ticket Scanner",
};

export const dynamic = "force-dynamic";

export default async function AdminScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const { eventId: urlEventId } = await searchParams;
  const cookieStore = await cookies();
  const cookieEventId = cookieStore.get(EM_SELECTED_EVENT_COOKIE)?.value ?? null;

  const eventsRaw = await withDbRetry(() =>
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, isFeatured: true, startDate: true, endDate: true },
    })
  );
  const events = rankPublishedEvents(eventsRaw);
  const selected = resolvePublishedEventSelection(events, {
    urlEventId,
    cookieEventId,
  });

  const dashboardHref = selected
    ? `/admin?eventId=${encodeURIComponent(selected.id)}`
    : "/admin";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={dashboardHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading scanner…</div>}>
        <TicketScannerClient
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          preferredEventId={selected?.id}
        />
      </Suspense>
    </div>
  );
}
