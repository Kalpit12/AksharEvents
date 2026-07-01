import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requirePrintingStaff } from "@/lib/printing-access";
import { loadPrintingDashboardPageDataWithRetry } from "@/lib/printing-page-data";
import PrintingArtworkDashboard from "@/components/printing-artwork/printing-artwork-dashboard";
import { formatDate } from "@/lib/utils";
import { Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrintingDashboardPage() {
  const user = await requirePrintingStaff();
  if (!user) redirect("/auth/printing");

  const data = await loadPrintingDashboardPageDataWithRetry();

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Palette className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Printing / Artwork Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No published event yet. Publish an expo so exhibitors can submit branding artwork.
        </p>
      </div>
    );
  }

  const dateRange = `${formatDate(data.startDate, "MMM d")}–${formatDate(data.endDate, "d, yyyy")}`;

  return (
    <Suspense
      fallback={
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-muted/40" aria-hidden />
      }
    >
      <PrintingArtworkDashboard
        eventTitle={data.eventTitle}
        eventLocation={data.eventLocation}
        dateRange={dateRange}
        records={data.records}
        floorPlan={data.floorPlan}
        floorPlanBooths={data.floorPlanBooths}
      />
    </Suspense>
  );
}
