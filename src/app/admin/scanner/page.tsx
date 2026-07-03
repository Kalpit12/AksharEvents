import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketScannerClient } from "@/components/admin/ticket-scanner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket Scanner",
};

export const dynamic = "force-dynamic";

export default async function AdminScannerPage() {
  const user = await requireRole("ADMIN");
  if (!user) redirect("/auth/login");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
    select: { id: true, title: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading scanner…</div>}>
        <TicketScannerClient events={events} />
      </Suspense>
    </div>
  );
}
