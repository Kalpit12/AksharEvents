import type { BookingStatus } from "@prisma/client";
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

/** GET /api/v1/events/{slug}/bookings */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const scopeErr = requireScope(auth.key, "bookings:read");
  if (scopeErr) return scopeErr;

  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0) || 0, 0);
  const statusParam = (searchParams.get("status") ?? "CONFIRMED").toUpperCase();

  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
  });

  if (!event) return jsonApiError("Event not found", 404);

  const accessErr = assertEventAccess(auth.key, event.id);
  if (accessErr) return accessErr;

  const statusFilter =
    statusParam === "ALL"
      ? undefined
      : (statusParam as BookingStatus);

  const where = {
    eventId: event.id,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        items: {
          include: { ticketType: { select: { name: true } } },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  const payload = {
    event,
    bookings: bookings.map((b) => ({
      bookingNumber: b.bookingNumber,
      status: b.status,
      attendeeName: b.attendeeName,
      attendeeEmail: b.attendeeEmail,
      attendeePhone: b.attendeePhone,
      attendeeCompany: b.attendeeCompany,
      totalAmount: toNumber(b.totalAmount),
      currency: b.currency,
      checkedIn: b.checkedIn,
      checkedInAt: b.checkedInAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      items: b.items.map((item) => ({
        ticketType: item.ticketType.name,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        subtotal: toNumber(item.subtotal),
      })),
    })),
    total,
  };

  void logApiUsage({
    apiKeyId: auth.key.id,
    path: `/api/v1/events/${slug}/bookings`,
    method: "GET",
    status: 200,
  });

  return jsonApiOk(payload);
}
