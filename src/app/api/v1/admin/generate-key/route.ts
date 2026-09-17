import {
  createDeveloperApiKey,
  DEVELOPER_SCOPES,
  getApiKeyFromRequest,
  isAdminGatewayKey,
  jsonApiError,
  jsonApiOk,
} from "@/lib/developer-api";

/** POST /api/v1/admin/generate-key */
export async function POST(request: Request) {
  const rawKey = getApiKeyFromRequest(request);
  if (!isAdminGatewayKey(rawKey)) {
    return jsonApiError("Admin API key required", 401);
  }

  let body: {
    name?: string;
    eventId?: string | null;
    rateLimit?: number;
    scopes?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return jsonApiError("Invalid JSON body", 400);
  }

  const name = body.name?.trim();
  if (!name) return jsonApiError("name is required", 422);

  if (body.scopes?.length) {
    const invalid = body.scopes.filter(
      (s) => !(DEVELOPER_SCOPES as readonly string[]).includes(s) && s !== "*",
    );
    if (invalid.length) {
      return jsonApiError(`Invalid scopes: ${invalid.join(", ")}`, 422);
    }
  }

  try {
    const created = await createDeveloperApiKey({
      name,
      eventId: body.eventId ?? null,
      rateLimit: body.rateLimit,
      scopes: body.scopes,
    });
    return jsonApiOk(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create key";
    const status = message === "Event not found" ? 404 : 400;
    return jsonApiError(message, status);
  }
}
