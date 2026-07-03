"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Building2, ClipboardList } from "lucide-react";

export function HeaderActions({ session }: { session: Session | null }) {
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isPrintingStaff = role === "PRINTING_STAFF";

  if (session?.user) {
    return (
      <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
        {!isAdmin && !isPrintingStaff ? (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/exhibitor">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Exhibitor Portal</span>
              <span className="lg:hidden">Exhibitor</span>
            </Link>
          </Button>
        ) : null}
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
      <Button variant="outline" size="sm" className="shrink-0" asChild>
        <Link href="/auth/exhibitor">
          <Building2 className="h-4 w-4" />
          Exhibitor
        </Link>
      </Button>
      <Button size="sm" className="shrink-0" asChild>
        <Link href="/booking-inquiries">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden lg:inline">Booking & Inquiries</span>
          <span className="lg:hidden">Inquiries</span>
        </Link>
      </Button>
    </div>
  );
}
