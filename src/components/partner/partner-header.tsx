"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { PartnerPublic } from "@/lib/partners";
import { partnerPath } from "@/lib/partners";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", path: "" },
  { label: "Events", path: "/events" },
  { label: "Venues", path: "/venues" },
  { label: "Categories", path: "/categories" },
  { label: "About", path: "/about" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

export function PartnerHeader({ partner }: { partner: PartnerPublic }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = partnerPath(partner.slug);

  return (
    <header className="sticky top-0 z-50 border-b border-[color-mix(in_oklab,var(--partner-primary)_35%,transparent)] bg-[var(--partner-background)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={base} className="flex min-w-0 items-center gap-3">
          {partner.logoUrl ? (
            <div className="relative h-11 w-[140px] shrink-0 sm:h-12 sm:w-[160px]">
              <SafeImage src={partner.logoUrl} alt={partner.name} fill className="object-contain object-left" />
            </div>
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: partner.primaryColor }}
            >
              {partner.name.charAt(0)}
            </div>
          )}
          {!partner.logoUrl && (
            <div className="min-w-0">
              <div className="truncate font-semibold">{partner.name}</div>
              {partner.tagline && (
                <div className="truncate text-xs text-muted-foreground">{partner.tagline}</div>
              )}
            </div>
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const href = partnerPath(partner.slug, item.path);
            const active = item.path === "" ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={item.path}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--partner-primary)]/10 text-[var(--partner-primary)]"
                    : "text-muted-foreground hover:text-[var(--partner-primary)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border/60 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={partnerPath(partner.slug, item.path)}
                className="rounded-lg px-3 py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
