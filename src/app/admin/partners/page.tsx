import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPartnersPanel from "@/components/admin/admin-partners-panel";
import { EventMasterPageHero, EventMasterQuickNav } from "@/components/event-master/event-master-ui";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const [partners, events] = await Promise.all([
    prisma.partner.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    }),
    prisma.event.findMany({
      orderBy: { startDate: "desc" },
      take: 50,
      select: { id: true, title: true, partnerId: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <EventMasterPageHero
        title="Partner sites"
        subtitle="Upload a logo to create a white-label site at /p/[slug]. Colors are picked from the logo."
      />
      <EventMasterQuickNav active="partners" />
      <AdminPartnersPanel partners={partners} events={events} />
    </div>
  );
}
