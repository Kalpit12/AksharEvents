import { getMobileAdminDashboard } from "@/lib/mobile-dashboard";
import { requireMobileUser, jsonError, jsonOk } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const user = await requireMobileUser(request, "ADMIN");
  if (!user) return jsonError("Unauthorized", 401);

  const data = await getMobileAdminDashboard();
  return jsonOk(data);
}
