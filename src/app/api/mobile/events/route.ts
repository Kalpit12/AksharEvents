import { getPublishedEvents } from "@/lib/events";
import { jsonOk } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);
  const search = searchParams.get("search") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
  const featured = searchParams.get("featured") === "true";
  const trending = searchParams.get("trending") === "true";

  const result = await getPublishedEvents({
    limit,
    offset,
    search,
    categorySlug,
    featured: featured || undefined,
    trending: trending || undefined,
  });

  const events = result.events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    format: e.format,
    shortDescription: e.shortDescription,
    description: e.description,
    startDate: e.startDate instanceof Date ? e.startDate.toISOString() : e.startDate,
    endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate,
    isFeatured: e.isFeatured,
    isTrending: e.isTrending,
    category: e.category?.name ?? null,
    venue: e.venue?.name ?? null,
    city: e.venue?.city ?? null,
    banner: e.banner,
    priceFrom:
      e.ticketTypes?.length > 0
        ? Math.min(
            ...e.ticketTypes.map((t) =>
              typeof t.price === "object" && t.price !== null && "toNumber" in t.price
                ? t.price.toNumber()
                : Number(t.price),
            ),
          )
        : 0,
  }));

  return jsonOk({ events, total: result.total });
}
