import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
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

/** GET /api/v1/events */
export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const scopeErr = requireScope(auth.key, "events:read");
  if (scopeErr) return scopeErr;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0) || 0, 0);
  const search = searchParams.get("search")?.trim() || undefined;

  const where = {
    status: "PUBLISHED" as const,
    ...(auth.key.eventId ? { id: auth.key.eventId } : {}),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: limit,
      skip: offset,
      include: {
        category: { select: { name: true } },
        venue: { select: { name: true, city: true } },
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: { price: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  const payload = {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      format: e.format,
      status: e.status,
      shortDescription: e.shortDescription,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      category: e.category?.name ?? null,
      venue: e.venue?.name ?? null,
      city: e.venue?.city ?? null,
      banner: e.banner,
      priceFrom:
        e.ticketTypes.length > 0
          ? Math.min(...e.ticketTypes.map((t) => toNumber(t.price)))
          : 0,
    })),
    total,
  };

  void logApiUsage({
    apiKeyId: auth.key.id,
    path: "/api/v1/events",
    method: "GET",
    status: 200,
  });

  return jsonApiOk(payload);
}
