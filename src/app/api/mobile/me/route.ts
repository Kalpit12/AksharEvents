import { getMobileUser, jsonError, jsonOk } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  return jsonOk({ user });
}
