import { notFound } from "next/navigation";
import { BoothKioskClient } from "@/components/booth/booth-kiosk-client";
import { formatExhibitorBoothLabel } from "@/lib/booth-allocation";
import { pickVisitorTicketType } from "@/lib/visitor-pass";
import { isPrismaSchemaDriftError, prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const entry = await prisma.eventExhibitor.findFirst({
    where: { boothKioskToken: token },
    include: { exhibitor: { select: { companyName: true } }, event: { select: { title: true } } },
  });
  if (!entry) return { title: "Booth visitor scan" };
  return {
    title: `${entry.exhibitor.companyName} — Booth visitors`,
    description: `Scan visitor passes at ${entry.exhibitor.companyName} booth for ${entry.event.title}.`,
  };
}

export default async function BoothKioskPage({ params }: Props) {
  const { token } = await params;

  try {
    const entry = await prisma.eventExhibitor.findFirst({
      where: { boothKioskToken: token, boothKioskEnabled: true },
      include: {
        exhibitor: { select: { companyName: true } },
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            venue: { select: { name: true, city: true } },
            ticketTypes: {
              where: { isActive: true },
              select: { id: true, name: true, price: true, quantity: true, sold: true },
            },
          },
        },
      },
    });

    if (!entry || entry.event.status !== "PUBLISHED") {
      notFound();
    }

    const boothLabel = formatExhibitorBoothLabel(entry.boothNumber, entry.hall);

    const ticketTypes = entry.event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price.toNumber(),
      available: t.quantity - t.sold,
    }));
    const visitorTicket = pickVisitorTicketType(ticketTypes);

    return (
      <BoothKioskClient
        token={token}
        companyName={entry.exhibitor.companyName}
        boothLabel={boothLabel}
        event={{
          title: entry.event.title,
          startDate: entry.event.startDate.toISOString(),
          endDate: entry.event.endDate.toISOString(),
          venueName: entry.event.venue?.name ?? null,
          venueCity: entry.event.venue?.city ?? null,
        }}
        registration={{
          ticketName: visitorTicket?.name ?? "Visitor pass",
          ticketPrice: visitorTicket?.price ?? 0,
          available: Boolean(visitorTicket && visitorTicket.available > 0),
        }}
      />
    );
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
          Booth visitor tracking is not available yet. The database needs to be updated.
        </div>
      );
    }
    throw error;
  }
}
