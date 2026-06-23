"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, Plus, Settings2, Sparkles, Store, Users } from "lucide-react";

export function EventMasterHero({
  eventTitle,
  eventLocation,
  dateRange,
  exhibitorCount,
  memberCount,
  expoDays,
  eventId,
}: {
  eventTitle: string;
  eventLocation: string;
  dateRange: string;
  exhibitorCount: number;
  memberCount: number;
  expoDays: number;
  eventId?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-champagne/30 bg-gradient-to-br from-espresso via-espresso/95 to-champagne-dark px-5 py-6 text-alabaster shadow-lg shadow-espresso/10 sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-alabaster/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-champagne/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-alabaster/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Event Master
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{eventTitle}</h1>
          <p className="mt-1 text-sm text-champagne-light/70">
            {eventLocation} · {dateRange}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-alabaster/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Store className="h-3.5 w-3.5" />
              {exhibitorCount} exhibitor{exhibitorCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-alabaster/10 px-3 py-1.5 text-sm backdrop-blur-sm">
              <Users className="h-3.5 w-3.5" />
              {memberCount} team member{memberCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-alabaster/10 px-3 py-1.5 text-xs text-champagne-light/80">
              <CalendarDays className="h-3.5 w-3.5" />
              {expoDays} expo day{expoDays === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne/25 px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne-light" />
              Live dashboard
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button asChild className="bg-alabaster text-espresso hover:bg-alabaster/90">
            <Link href="/admin/events">
              <Plus className="h-4 w-4" />
              Create event
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-alabaster/30 bg-transparent text-alabaster hover:bg-alabaster/10 hover:text-alabaster">
            <Link href="/admin/events">
              <Settings2 className="h-4 w-4" />
              Manage events
            </Link>
          </Button>
          {eventId && (
            <Button asChild variant="outline" className="border-alabaster/30 bg-transparent text-alabaster hover:bg-alabaster/10 hover:text-alabaster">
              <Link href={`/admin/events/${eventId}/activities`}>
                <Calendar className="h-4 w-4" />
                Schedule
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventMasterPageHero({
  title,
  subtitle,
  showCreateAction = true,
  createHref = "/admin/events#create-event",
}: {
  title: string;
  subtitle: string;
  showCreateAction?: boolean;
  createHref?: string;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-champagne/30 bg-gradient-to-br from-espresso via-espresso/95 to-champagne-dark px-5 py-6 text-alabaster shadow-lg shadow-espresso/10 sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-alabaster/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-alabaster/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Event Master
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-champagne-light/70">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {showCreateAction && (
            <Button asChild className="bg-alabaster text-espresso hover:bg-alabaster/90">
              <Link href={createHref}>
                <Plus className="h-4 w-4" />
                Create event
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="border-alabaster/30 bg-transparent text-alabaster hover:bg-alabaster/10 hover:text-alabaster">
            <Link href="/admin">← Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EventMasterQuickNav({
  active,
  eventId,
}: {
  active: "dashboard" | "events" | "schedule";
  eventId?: string;
}) {
  const links = [
    { id: "dashboard" as const, href: "/admin", label: "Dashboard" },
    { id: "events" as const, href: "/admin/events", label: "Events" },
    ...(eventId
      ? [{ id: "schedule" as const, href: `/admin/events/${eventId}/activities`, label: "Schedule" }]
      : []),
  ];

  return (
    <nav className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === link.id
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
