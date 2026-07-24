import type { EventFormat } from "@prisma/client";
import { prisma, withDbRetry } from "@/lib/prisma";

export const EXHIBITOR_EVENT_FORMATS: EventFormat[] = [
  "EXPO",
  "CONFERENCE",
  "JOB_FAIR",
  "CAREER_EVENT",
  "UNIVERSITY_EVENT",
  "TECHNOLOGY",
  "HEALTHCARE",
  "OTHER",
];

export type OpenExhibitorEvent = {
  id: string;
  title: string;
  slug: string;
  format: EventFormat;
  startDate: string;
  endDate: string;
  city: string | null;
  venueName: string | null;
};

export async function getOpenExhibitorEvents(): Promise<OpenExhibitorEvent[]> {
  const events = await withDbRetry(() =>
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        format: { in: EXHIBITOR_EVENT_FORMATS },
        endDate: { gte: new Date() },
      },
      orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
      include: {
        venue: { select: { name: true, city: true } },
      },
    })
  );

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    format: event.format,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    city: event.venue?.city ?? null,
    venueName: event.venue?.name ?? null,
  }));
}

export async function getOpenExhibitorEventById(eventId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
      format: { in: EXHIBITOR_EVENT_FORMATS },
      endDate: { gte: new Date() },
    },
    select: { id: true, title: true },
  });
}

export async function linkExhibitorToEvent(exhibitorId: string, eventId: string) {
  const event = await getOpenExhibitorEventById(eventId);
  if (!event) {
    return { error: "Selected event is not open for exhibitor registration" as const };
  }

  const eventMeta = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, title: true },
  });
  if (!eventMeta) {
    return { error: "Selected event is not open for exhibitor registration" as const };
  }

  const existing = await prisma.eventExhibitor.findUnique({
    where: { eventId_exhibitorId: { eventId, exhibitorId } },
  });
  if (existing) {
    return {
      success: true as const,
      eventExhibitorId: existing.id,
      alreadyLinked: true as const,
      eventId: eventMeta.id,
      eventSlug: eventMeta.slug,
      eventTitle: eventMeta.title,
    };
  }

  const entry = await prisma.eventExhibitor.create({
    data: { eventId, exhibitorId },
  });

  return {
    success: true as const,
    eventExhibitorId: entry.id,
    alreadyLinked: false as const,
    eventId: eventMeta.id,
    eventSlug: eventMeta.slug,
    eventTitle: eventMeta.title,
  };
}
