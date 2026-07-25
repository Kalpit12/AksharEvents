"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ferrofluid from "@/components/ferrofluid/Ferrofluid";
import { HERO_FERROFLUID } from "@/lib/hero-ferrofluid";
import { Button } from "@/components/ui/Button";
import { persistEmSelectedEventId } from "@/lib/em-selected-event";
import { eventLifecycleLabel } from "@/lib/primary-event";
import { cn } from "@/lib/utils";
import type { PublishedEventOption } from "@/components/event-master/visitor-check-ins-panel";
import { CalendarDays, Plus, Settings2, Sparkles, Store, Users } from "lucide-react";

function lifecycleBadgeClass(lifecycle: "Live" | "Upcoming" | "Completed") {
  if (lifecycle === "Live") return "border-emerald-400/30 bg-emerald-500/25 text-emerald-100";
  if (lifecycle === "Upcoming") return "border-sky-400/30 bg-sky-500/20 text-sky-100";
  return "border-alabaster/15 bg-alabaster/10 text-champagne-light/80";
}

export function EventMasterEventSwitcher({
  eventId,
  events,
}: {
  eventId: string;
  events: PublishedEventOption[];
}) {
  const router = useRouter();

  useEffect(() => {
    persistEmSelectedEventId(eventId);
  }, [eventId]);

  if (events.length <= 1) return null;

  const onChange = (nextEventId: string) => {
    if (!nextEventId || nextEventId === eventId) return;
    persistEmSelectedEventId(nextEventId);
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    params.set("eventId", nextEventId);
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-sm">
      <label htmlFor="em-event-switcher" className="mb-1.5 block text-xs font-medium text-champagne-light/70">
        Managing event
      </label>
      <select
        id="em-event-switcher"
        value={eventId}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-alabaster/20 bg-espresso/80 px-3 text-sm text-alabaster shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
      >
        {events.map((event) => {
          const lifecycle =
            event.lifecycle ?? eventLifecycleLabel(event.startDate, event.endDate);
          return (
            <option key={event.id} value={event.id} className="bg-espresso text-alabaster">
              {event.title} · {lifecycle}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function EventMasterHero({
  eventId,
  eventTitle,
  eventLocation,
  dateRange,
  exhibitorCount,
  memberCount,
  expoDays,
  lifecycle,
  publishedEvents = [],
}: {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  dateRange: string;
  exhibitorCount: number;
  memberCount: number;
  expoDays: number;
  lifecycle?: "Live" | "Upcoming" | "Completed";
  publishedEvents?: PublishedEventOption[];
}) {
  const status = lifecycle ?? "Live";

  return (
    <div className="relative min-h-[172px] overflow-hidden rounded-2xl border border-champagne/30 bg-espresso text-alabaster shadow-lg shadow-espresso/10 sm:min-h-[188px]">
      <Ferrofluid {...HERO_FERROFLUID} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-espresso/82 via-espresso/58 to-champagne-dark/38" />

      <div className="relative z-10 flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-alabaster/10 bg-alabaster/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Event Master
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                lifecycleBadgeClass(status)
              )}
            >
              {status === "Live" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              )}
              {status}
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{eventTitle}</h1>
          <p className="mt-1 text-sm text-champagne-light/75">
            {eventLocation} · {dateRange}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-alabaster/10 bg-alabaster/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Store className="h-3.5 w-3.5" />
              {exhibitorCount} exhibitor{exhibitorCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-alabaster/5 bg-alabaster/10 px-3 py-1.5 text-sm backdrop-blur-sm">
              <Users className="h-3.5 w-3.5" />
              {memberCount} team member{memberCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-alabaster/5 bg-alabaster/10 px-3 py-1.5 text-xs text-champagne-light/80 backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {expoDays} expo day{expoDays === 1 ? "" : "s"}
            </span>
          </div>

          {publishedEvents.length > 1 && (
            <div className="mt-4">
              <EventMasterEventSwitcher eventId={eventId} events={publishedEvents} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button asChild className="bg-alabaster text-espresso hover:bg-alabaster/90">
            <Link href="/admin/events">
              <Plus className="h-4 w-4" />
              Create event
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-alabaster/30 bg-transparent text-alabaster hover:bg-alabaster/10 hover:text-alabaster"
          >
            <Link href="/admin/events">
              <Settings2 className="h-4 w-4" />
              Manage events
            </Link>
          </Button>
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
  dashboardHref = "/admin",
}: {
  title: string;
  subtitle: string;
  showCreateAction?: boolean;
  createHref?: string;
  dashboardHref?: string;
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
            <Link href={dashboardHref}>← Dashboard</Link>
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
  const dashboardHref = eventId ? `/admin?eventId=${encodeURIComponent(eventId)}` : "/admin";
  const links = [
    { id: "dashboard" as const, href: dashboardHref, label: "Dashboard" },
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
