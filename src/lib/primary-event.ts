import { prisma, withDbRetry } from "@/lib/prisma";

type RankablePublishedEvent = {
  id: string;
  isFeatured: boolean;
  startDate: Date;
  endDate: Date;
};

/** Live → upcoming (soonest) → past (most recent), then featured, then start date. */
export function rankPublishedEvents<T extends RankablePublishedEvent>(
  events: T[],
  now = new Date()
): T[] {
  const phase = (e: T) => {
    if (e.endDate >= now && e.startDate <= now) return 0;
    if (e.startDate > now) return 1;
    return 2;
  };

  return [...events].sort((a, b) => {
    const pa = phase(a);
    const pb = phase(b);
    if (pa !== pb) return pa - pb;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (pa === 2) return b.endDate.getTime() - a.endDate.getTime();
    return a.startDate.getTime() - b.startDate.getTime();
  });
}

export function pickPrimaryPublishedEvent<T extends RankablePublishedEvent>(
  events: T[],
  now = new Date()
): T | null {
  return rankPublishedEvents(events, now)[0] ?? null;
}

/**
 * Resolve which published event the Event Master dashboard should show.
 * Priority: URL eventId → remembered cookie → smart primary default.
 * Only IDs present in `events` are accepted (no cross-tenant / stale IDs).
 */
export function resolvePublishedEventSelection<T extends RankablePublishedEvent>(
  events: T[],
  options: {
    urlEventId?: string | null;
    cookieEventId?: string | null;
    now?: Date;
  } = {}
): T | null {
  if (events.length === 0) return null;

  const { urlEventId, cookieEventId, now = new Date() } = options;

  if (urlEventId) {
    const fromUrl = events.find((e) => e.id === urlEventId);
    if (fromUrl) return fromUrl;
  }

  if (cookieEventId) {
    const fromCookie = events.find((e) => e.id === cookieEventId);
    if (fromCookie) return fromCookie;
  }

  return pickPrimaryPublishedEvent(events, now);
}

export function eventLifecycleLabel(
  startDate: Date | string,
  endDate: Date | string,
  now = new Date()
): "Live" | "Upcoming" | "Completed" {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  if (end < now) return "Completed";
  if (start > now) return "Upcoming";
  return "Live";
}

export async function getPrimaryPublishedEvent() {
  return withDbRetry(async () => {
    const events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      include: {
        venue: { select: { name: true, city: true } },
      },
    });
    return pickPrimaryPublishedEvent(events);
  });
}
