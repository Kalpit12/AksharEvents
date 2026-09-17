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

/** GET /api/v1/events/{slug}/stats */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const scopeErr = requireScope(auth.key, "stats:read");
  if (scopeErr) return scopeErr;

  const { slug } = await context.params;

  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      ticketTypes: {
        select: { quantity: true, sold: true, currency: true },
      },
    },
  });

  if (!event) return jsonApiError("Event not found", 404);

  const accessErr = assertEventAccess(auth.key, event.id);
  if (accessErr) return accessErr;

  const [confirmed, pending, cancelled, checkedIn, revenueAgg] =
    await Promise.all([
      prisma.booking.count({
        where: { eventId: event.id, status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: { eventId: event.id, status: "PENDING" },
      }),
      prisma.booking.count({
        where: { eventId: event.id, status: "CANCELLED" },
      }),
      prisma.booking.count({
        where: { eventId: event.id, status: "CONFIRMED", checkedIn: true },
      }),
      prisma.booking.aggregate({
        where: { eventId: event.id, status: "CONFIRMED" },
        _sum: { totalAmount: true },
      }),
    ]);

  const capacity = event.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
  const sold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
  const currency = event.ticketTypes[0]?.currency ?? "KES";

  const payload = {
    event: { id: event.id, title: event.title, slug: event.slug },
    bookings: {
      confirmed,
      pending,
      cancelled,
      checkedIn,
    },
    tickets: {
      capacity,
      sold,
      remaining: Math.max(capacity - sold, 0),
    },
    revenue: {
      currency,
      confirmedTotal: toNumber(revenueAgg._sum.totalAmount),
    },
    updatedAt: new Date().toISOString(),
  };

  void logApiUsage({
    apiKeyId: auth.key.id,
    path: `/api/v1/events/${slug}/stats`,
    method: "GET",
    status: 200,
  });

  return jsonApiOk(payload);
}
