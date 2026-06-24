import Link from "next/link";
import { auth } from "@/lib/auth";
import { BRAND } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Calendar,
  ClipboardList,
  Building2,
} from "lucide-react";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/categories", label: "Categories" },
  { href: "/venues", label: "Venues" },
  { href: "/tourist-attractions", label: "Tourist attractions" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const navLinkClass =
  "shrink-0 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

export default async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <div className="hidden shrink-0 sm:block">
            <span className="whitespace-nowrap font-bold text-foreground">{BRAND.name}</span>
            <p className="whitespace-nowrap text-[10px] leading-none text-primary">{BRAND.tagline}</p>
          </div>
        </Link>

        <nav className="hidden shrink-0 flex-nowrap items-center gap-4 xl:flex 2xl:gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-0 flex-1 xl:block" aria-hidden />

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden w-full max-w-[12rem] min-w-0 lg:block lg:max-w-[14rem] xl:max-w-xs 2xl:max-w-sm">
            <SearchBar />
          </div>

          <ThemeToggle />

          {session?.user ? (
            <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
              {isAdmin ? (
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link href="/admin">
                    <Calendar className="h-4 w-4" />
                    Event Master
                  </Link>
                </Button>
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
          ) : (
            <div className="hidden shrink-0 flex-nowrap items-center gap-2 md:flex">
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link href="/auth/exhibitor">
                  <Building2 className="h-4 w-4" />
                  Exhibitor
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link href="/auth/login">
                  <Calendar className="h-4 w-4" />
                  Event Master
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
          )}

          <MobileNav session={session} navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
