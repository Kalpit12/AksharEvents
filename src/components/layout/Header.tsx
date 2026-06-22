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
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-foreground">{BRAND.name}</span>
            <p className="text-[10px] leading-none text-primary">{BRAND.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mx-4 hidden max-w-md flex-1 md:flex">
          <SearchBar />
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              {isAdmin ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <Calendar className="h-4 w-4" />
                    Event Master
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/exhibitor">
                    <Building2 className="h-4 w-4" />
                    Exhibitor Portal
                  </Link>
                </Button>
              )}
              <LogoutButton />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/exhibitor">
                  <Building2 className="h-4 w-4" />
                  Exhibitor
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">
                  <Calendar className="h-4 w-4" />
                  Event Master
                </Link>
              </Button>
              <Button size="sm" asChild>
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

