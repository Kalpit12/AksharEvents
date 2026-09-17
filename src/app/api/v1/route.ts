import { jsonApiOk } from "@/lib/developer-api";

/** GET /api/v1 — gateway health (no auth required) */
export async function GET() {
  return jsonApiOk({
    status: "online",
    gateway: "AxarEvents Developer Gateway",
    version: "1.0.0",
    docs: "/docs",
    openapi: "/openapi.json",
  });
}
