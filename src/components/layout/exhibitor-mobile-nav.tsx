"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, FileText, Home, LayoutDashboard, LifeBuoy, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signOut } from "next-auth/react";

const portalLinks = [
  { href: "/exhibitor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exhibitor-registration-questions.pdf", label: "Registration guide", icon: FileText, external: true },
  { href: "/contact", label: "Support", icon: LifeBuoy },
] as const;

export function ExhibitorMobileNav({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-alabaster hover:bg-alabaster/10 hover:text-alabaster"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close portal menu" : "Open portal menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/40 sm:top-16"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-champagne/20 bg-espresso p-4 shadow-lg sm:top-16 sm:max-h-[calc(100dvh-4rem)]">
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-alabaster/10 px-3 py-2.5">
              <Building2 className="h-4 w-4 text-champagne-light" />
              <div className="min-w-0">
                <p className="text-xs text-champagne-light">Exhibitor Portal</p>
                <p className="truncate text-sm font-medium text-alabaster">{companyName}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {portalLinks.map((link) => {
                const Icon = link.icon;
                const className =
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-alabaster/90 hover:bg-alabaster/10";

                if ("external" in link && link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className={className}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={className}>
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-alabaster/10" />

              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-alabaster/90 hover:bg-alabaster/10"
              >
                <Home className="h-4 w-4" />
                Main site
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-alabaster/20 bg-alabaster/10 px-3 py-2.5 text-sm font-medium text-alabaster hover:bg-alabaster/20"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
