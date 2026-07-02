"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/logout-button";
import { ClipboardList } from "lucide-react";

export function HeaderActions({ session }: { session: Session | null }) {
  if (session?.user) {
    return (
      <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
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
