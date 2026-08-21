import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import AdminPartnersPanel from "@/components/admin/admin-partners-panel";
import { EventMasterPageHero, EventMasterQuickNav } from "@/components/event-master/event-master-ui";
import { EM_SELECTED_EVENT_COOKIE } from "@/lib/em-selected-event";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const cookieStore = await cookies();
  const cookieEventId = cookieStore.get(EM_SELECTED_EVENT_COOKIE)?.value ?? null;

  const { partners, events } = await withDbRetry(async () => {
    const [partners, events] = await Promise.all([
      prisma.partner.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          backgroundColor: true,
          foregroundColor: true,
          contactEmail: true,
          contactPhone: true,
          isActive: true,
          _count: { select: { events: true } },
        },
      }),
      prisma.event.findMany({
        orderBy: { startDate: "desc" },
        take: 50,
        select: { id: true, title: true, partnerId: true, status: true },
      }),
    ]);
    return { partners, events };
  });

  const rememberedEventId =
    cookieEventId && events.some((event) => event.id === cookieEventId && event.status === "PUBLISHED")
      ? cookieEventId
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <EventMasterPageHero
        title="Partner sites"
        subtitle="Upload a logo to create a white-label site at /p/[slug]. Colors are picked from the logo."
      />
      <EventMasterQuickNav active="partners" eventId={rememberedEventId} />
      <AdminPartnersPanel
        partners={partners}
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          partnerId: event.partnerId,
        }))}
      />
    </div>
  );
}
