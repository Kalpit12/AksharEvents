import Link from "next/link";
import { auth } from "@/lib/auth";
import { ExhibitorHeaderNotifications } from "@/components/layout/exhibitor-header-notifications";
import { PortalProfileMenu } from "@/components/layout/portal-profile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { exhibitorPortalLinks } from "@/lib/exhibitor-portal-links";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/utils";
import { Building2 } from "lucide-react";

const portalLinks = exhibitorPortalLinks;

export default async function ExhibitorHeader() {
  const session = await auth();
  const displayName = session?.user?.name ?? "Exhibitor";
  const unreadCount = session?.user?.id
    ? await prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      })
    : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-champagne/30 bg-gradient-to-r from-espresso via-espresso/95 to-espresso text-alabaster shadow-md shadow-espresso/20 supports-[backdrop-filter]:bg-espresso/95">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/exhibitor" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/20">
            A
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-white">{BRAND.name}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-alabaster/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-champagne-light">
                <Building2 className="h-3 w-3" />
                Portal
              </span>
            </div>
            <p className="truncate text-[11px] text-champagne-light/90">{displayName}</p>
          </div>
        </Link>

        {portalLinks.length > 0 && (
          <nav className="hidden items-center gap-1 lg:flex">
            {portalLinks.map((link) => {
              const Icon = link.icon;
              const className =
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-champagne-light transition-colors hover:bg-alabaster/10 hover:text-alabaster";

              if ("external" in link && link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
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
        )}

        <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
          <ExhibitorHeaderNotifications initialUnreadCount={unreadCount} />
          <ThemeToggle className="text-champagne-light hover:bg-alabaster/10 hover:text-alabaster" />
          <PortalProfileMenu name={displayName} email={session?.user?.email} />
        </div>
      </div>
    </header>
  );
}
