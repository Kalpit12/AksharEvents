import { prisma } from "@/lib/prisma";
import {
  assertEventAccess,
  authenticateApiKey,
  jsonApiError,
  jsonApiOk,
  logApiUsage,
  requireScope,
} from "@/lib/developer-api";

function toNumber(value: unknown): number {
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

type RouteContext = { params: Promise<{ slug: string }> };

/** GET /api/v1/events/{slug} */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const scopeErr = requireScope(auth.key, "events:read");
  if (scopeErr) return scopeErr;

  const { slug } = await context.params;

  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: { select: { name: true } },
      venue: { select: { name: true, city: true, address: true } },
      ticketTypes: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!event) {
    return jsonApiError("Event not found", 404);
  }

  const accessErr = assertEventAccess(auth.key, event.id);
  if (accessErr) return accessErr;

  const payload = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    format: event.format,
    status: event.status,
    shortDescription: event.shortDescription,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    capacity: event.capacity,
    category: event.category?.name ?? null,
    venue: event.venue?.name ?? null,
    city: event.venue?.city ?? null,
    banner: event.banner,
    priceFrom:
      event.ticketTypes.length > 0
        ? Math.min(...event.ticketTypes.map((t) => toNumber(t.price)))
        : 0,
    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      tier: t.tier,
      price: toNumber(t.price),
      currency: t.currency,
      quantity: t.quantity,
      sold: t.sold,
      isActive: t.isActive,
    })),
  };

  void logApiUsage({
    apiKeyId: auth.key.id,
    path: `/api/v1/events/${slug}`,
    method: "GET",
    status: 200,
  });

  return jsonApiOk(payload);
}
