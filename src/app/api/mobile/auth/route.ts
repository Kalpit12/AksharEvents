import { mobileLogin, mobileRegisterExhibitor } from "@/lib/mobile-auth-service";
import { jsonError, jsonOk } from "@/lib/mobile-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const portal = body.portal === "admin" ? "admin" : "exhibitor";

    if (body.action === "register") {
      const result = await mobileRegisterExhibitor(body);
      if ("error" in result && result.error) return jsonError(result.error, 401);
      return jsonOk(result);
    }

    if (!body.email || !body.password) {
      return jsonError("Email and password are required");
    }

    const result = await mobileLogin(body.email, body.password, portal);
    if ("error" in result && result.error) return jsonError(result.error, 401);
    return jsonOk(result);
  } catch {
    return jsonError("Authentication failed", 500);
  }
}
