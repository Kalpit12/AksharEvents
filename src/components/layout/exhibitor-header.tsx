import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { BRAND } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { ExhibitorMobileNav } from "@/components/layout/exhibitor-mobile-nav";
import { Button } from "@/components/ui/Button";
import { exhibitorPortalLinks } from "@/lib/exhibitor-portal-links";
import { Building2, ExternalLink, Home } from "lucide-react";

const portalLinks = exhibitorPortalLinks;

export default async function ExhibitorHeader() {
  const session = await auth();
  const access = session?.user ? await requireExhibitorAccess(session.user.id) : null;
  const companyName = access?.exhibitor.companyName ?? session?.user?.name ?? "Exhibitor";

  return (
    <header className="sticky top-0 z-50 border-b border-champagne/30 bg-gradient-to-r from-espresso via-espresso/95 to-espresso text-alabaster shadow-md shadow-espresso/20 supports-[backdrop-filter]:bg-espresso/95">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/exhibitor" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/20">
            A
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-white">{BRAND.name}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-alabaster/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-champagne-light">
                <Building2 className="h-3 w-3" />
                Portal
              </span>
            </div>
            <p className="truncate text-[11px] text-champagne-light/90">{companyName}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {portalLinks.map((link) => {
            const Icon = link.icon;
            const className =
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-champagne-light transition-colors hover:bg-alabaster/10 hover:text-alabaster";

            if ("external" in link && link.external) {
              return (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            }

            return (
              <Link key={link.href} href={link.href} className={className}>
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden text-champagne-light hover:bg-alabaster/10 hover:text-alabaster md:inline-flex"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">Main site</span>
              <ExternalLink className="h-3 w-3 opacity-60 lg:hidden" />
            </Link>
          </Button>

          <ThemeToggle className="text-champagne-light hover:bg-alabaster/10 hover:text-alabaster" />

          <LogoutButton
            variant="ghost"
            className="hidden border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white md:inline-flex"
          />

          <ExhibitorMobileNav companyName={companyName} />
        </div>
      </div>
    </header>
  );
}
