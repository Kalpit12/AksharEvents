import { notFound } from "next/navigation";
import { BoothKioskClient } from "@/components/booth/booth-kiosk-client";
import { loadEventForBoothKioskPage } from "@/lib/booth-kiosk-actions";
import { pickVisitorTicketType } from "@/lib/visitor-pass";
import { isPrismaSchemaDriftError } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEventForBoothKioskPage(slug);
  if (!event) return { title: "On-site registration" };
  return {
    title: `${event.title} — On-site registration`,
    description: `Register walk-in visitors and check in event passes for ${event.title}.`,
  };
}

export default async function BoothKioskPage({ params }: Props) {
  const { slug } = await params;

  try {
    const event = await loadEventForBoothKioskPage(slug);
    if (!event) notFound();

    const ticketTypes = event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price.toNumber(),
      tier: t.tier,
      available: t.quantity - t.sold,
    }));
    const visitorTicket = pickVisitorTicketType(ticketTypes);

    return (
      <BoothKioskClient
        eventSlug={event.slug}
        eventId={event.id}
        event={{
          title: event.title,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          startTime: event.startTime,
          endTime: event.endTime,
          venueName: event.venue?.name ?? null,
          venueCity: event.venue?.city ?? null,
        }}
        registration={{
          ticketTypeId: visitorTicket?.id ?? "",
          ticketName: visitorTicket?.name ?? "Visitor pass",
          ticketTier: visitorTicket?.tier ?? "FREE",
          ticketPrice: visitorTicket?.price ?? 0,
          available: Boolean(visitorTicket && visitorTicket.available > 0),
        }}
      />
    );
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
          On-site registration is not available yet. The database needs to be updated.
        </div>
      );
    }
    throw error;
  }
}
