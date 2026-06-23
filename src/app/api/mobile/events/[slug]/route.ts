import { getEventBySlug } from "@/lib/events";
import { jsonError, jsonOk } from "@/lib/mobile-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "PUBLISHED") {
    return jsonError("Event not found", 404);
  }

  return jsonOk({
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      format: event.format,
      description: event.description,
      shortDescription: event.shortDescription,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      isFeatured: event.isFeatured,
      category: event.category,
      venue: event.venue,
      organizer: event.organizer,
      ticketTypes: event.ticketTypes.map((t) => ({
        id: t.id,
        name: t.name,
        tier: t.tier,
        price:
          typeof t.price === "object" && t.price !== null && "toNumber" in t.price
            ? t.price.toNumber()
            : Number(t.price),
        quantity: t.quantity,
        sold: t.sold,
      })),
      agenda: event.agendaItems,
      speakers: event.speakers,
      faqs: event.faqs,
    },
  });
}
