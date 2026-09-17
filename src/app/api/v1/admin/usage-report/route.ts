import { prisma } from "@/lib/prisma";
import {
  getApiKeyFromRequest,
  isAdminGatewayKey,
  jsonApiError,
  jsonApiOk,
} from "@/lib/developer-api";

/** GET /api/v1/admin/usage-report */
export async function GET(request: Request) {
  const rawKey = getApiKeyFromRequest(request);
  if (!isAdminGatewayKey(rawKey)) {
    return jsonApiError("Admin API key required", 401);
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const keys = await prisma.apiKey.findMany({
    orderBy: { requestCount: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      eventId: true,
      requestCount: true,
      lastUsedAt: true,
      isActive: true,
    },
  });

  const recentCounts = await prisma.apiKeyUsageLog.groupBy({
    by: ["apiKeyId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const recentByKey = new Map(
    recentCounts.map((r) => [r.apiKeyId, r._count._all]),
  );

  return jsonApiOk({
    generatedAt: new Date().toISOString(),
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      eventId: k.eventId,
      requestCount: k.requestCount,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      isActive: k.isActive,
      recentRequests: recentByKey.get(k.id) ?? 0,
    })),
  });
}
