import { redirect } from "next/navigation";
import { requirePrintingStaff } from "@/lib/printing-access";

export default async function PrintingLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePrintingStaff();
  if (!user) redirect("/auth/printing");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-gradient-to-b from-muted/40 via-background to-background p-1 sm:p-2">
          {children}
        </div>
      </div>
    </div>
  );
}
