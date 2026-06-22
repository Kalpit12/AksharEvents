"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Calendar, ClipboardList, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/layout/search-bar";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

interface MobileNavProps {
  session: Session | null;
  navLinks: { href: string; label: string }[];
}

export function MobileNav({ session, navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/20 sm:top-16"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background p-4 shadow-lg sm:top-16 sm:max-h-[calc(100dvh-4rem)]">
            <div className="mb-4">
              <SearchBar />
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2 border-t border-border" />

              {!session ? (
                <>
                  <Link
                    href="/auth/exhibitor"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium hover:bg-muted"
                  >
                    <Building2 className="h-4 w-4" />
                    Exhibitor Sign In / Sign Up
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium hover:bg-muted"
                  >
                    <Calendar className="h-4 w-4" />
                    Event Master Sign In
                  </Link>
                  <Link
                    href="/booking-inquiries"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Booking & Inquiries
                  </Link>
                </>
              ) : isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-primary-foreground"
                >
                  <Calendar className="h-4 w-4" />
                  Event Master
                </Link>
              ) : (
                <Link
                  href="/exhibitor"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-primary-foreground"
                >
                  <Building2 className="h-4 w-4" />
                  Exhibitor Portal
                </Link>
              )}

              {session && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
