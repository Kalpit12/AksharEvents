import type { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export const PRINTING_STAFF_ROLES: UserRole[] = ["ADMIN", "PRINTING_STAFF"];

export function isPrintingStaffRole(role: UserRole) {
  return PRINTING_STAFF_ROLES.includes(role);
}

export async function requirePrintingStaff() {
  const user = await getCurrentUser();
  if (!user || !isPrintingStaffRole(user.role)) return null;
  return user;
}
