import { getMobileExhibitorDashboard } from "@/lib/mobile-dashboard";
import { requireMobileUser, jsonError, jsonOk } from "@/lib/mobile-api";

export async function GET(request: Request) {
  const user = await requireMobileUser(request, "ATTENDEE", "ADMIN");
  if (!user) return jsonError("Unauthorized", 401);

  const data = await getMobileExhibitorDashboard(user.id);
  if (!data) return jsonError("No exhibitor access", 403);
  return jsonOk(data);
}
