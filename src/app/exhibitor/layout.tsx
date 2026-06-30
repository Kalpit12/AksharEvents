import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ExhibitorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/exhibitor?mode=signin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-gradient-to-b from-muted/40 via-background to-background p-1 sm:p-2">
        {children}
      </div>
    </div>
  );
}
