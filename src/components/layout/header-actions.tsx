"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Building2, Calendar, ClipboardList, Palette } from "lucide-react";

export function HeaderActions({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isPrintingStaff = role === "PRINTING_STAFF";

  if (session?.user) {
    return (
      <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
        {isAdmin ? (
          <>
            {!isHomepage ? (
              <>
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link href="/admin">
                    <Calendar className="h-4 w-4" />
                    Event Master
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link href="/printing">
                    <Palette className="h-4 w-4" />
                    Printing
                  </Link>
                </Button>
              </>
            ) : null}
          </>
        ) : isPrintingStaff ? (
          !isHomepage ? (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/printing">
                <Palette className="h-4 w-4" />
                Printing Dashboard
              </Link>
            </Button>
          ) : null
        ) : (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/exhibitor">
              <Building2 className="h-4 w-4" />
              Exhibitor Portal
            </Link>
          </Button>
        )}
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
      {!isHomepage ? (
        <>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/auth/login">
              <Calendar className="h-4 w-4" />
              Event Master
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/auth/printing">
              <Palette className="h-4 w-4" />
              Printing
            </Link>
          </Button>
        </>
      ) : null}
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
