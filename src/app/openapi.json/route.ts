import { getDeveloperOpenApiSpec } from "@/lib/developer-openapi";

/** GET /openapi.json — OpenAPI 3.1 specification */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const spec = getDeveloperOpenApiSpec(origin);

  return Response.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
