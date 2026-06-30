import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPrintingStaffRole } from "@/lib/printing-access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role === "PRINTING_STAFF") redirect("/printing");
  if (user.role !== "ADMIN") redirect("/auth/exhibitor?mode=signin");

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
