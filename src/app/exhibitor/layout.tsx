import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireExhibitorAccess } from "@/lib/exhibitor";

export default async function ExhibitorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/exhibitor?mode=signin");

  const access = await requireExhibitorAccess(user.id);
  if (!access) redirect("/auth/exhibitor?mode=signup");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-gradient-to-b from-muted/40 via-background to-background p-1 sm:p-2">
        {children}
      </div>
    </div>
  );
}
