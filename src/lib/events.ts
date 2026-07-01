import { prisma } from "./prisma";
import { isFrontendOnly } from "./frontend-only";
import {
  getMockPublishedEvents,
  getMockEventBySlug,
  getMockSimilarEvents,
  getMockRecommendedEvents,
} from "./mock-data";
import type { EventFormat, EventStatus } from "@prisma/client";

export async function getPublishedEvents({
  limit = 12,
  offset = 0,
  categorySlug,
  format,
  city,
  search,
  featured,
  trending,
  sort = "upcoming",
}: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  format?: EventFormat;
  city?: string;
  search?: string;
  featured?: boolean;
  trending?: boolean;
  sort?: "upcoming" | "newest" | "popular";
} = {}) {
  if (isFrontendOnly()) {
    return getMockPublishedEvents({
      limit,
      offset,
      categorySlug,
      format,
      city,
      search,
      featured,
      trending,
      sort,
    });
  }

  const where = {
    status: "PUBLISHED" as EventStatus,
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(format && { format }),
    ...(city && { venue: { city: { contains: city, mode: "insensitive" as const } } }),
    ...(featured && { isFeatured: true }),
    ...(trending && { isTrending: true }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search.toLowerCase() } },
      ],
    }),
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "popular"
        ? { viewCount: "desc" as const }
        : { startDate: "asc" as const };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        category: true,
        venue: { select: { name: true, city: true, address: true } },
        organizer: { select: { id: true, name: true, image: true, isVerified: true } },
        ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" } },
        _count: { select: { reviews: true, favorites: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, pages: Math.ceil(total / limit) };
}

export async function getEventBySlug(slug: string) {
  if (isFrontendOnly()) {
    return getMockEventBySlug(slug);
  }

  return prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      venue: true,
      organizer: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          company: true,
          isVerified: true,
          _count: { select: { organizedEvents: true } },
        },
      },
      ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" } },
      speakers: { orderBy: { order: "asc" } },
      agenda: { orderBy: { order: "asc" } },
      scheduleItems: { where: { isActive: true }, orderBy: { startAt: "asc" } },
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      sponsors: {
        include: { sponsor: true },
        orderBy: [{ level: "asc" }, { order: "asc" }],
      },
      exhibitors: {
        include: { exhibitor: true },
      },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true, favorites: true, bookings: true } },
    },
  });
}

export async function getRecommendedEvents(userId?: string, limit = 6) {
  if (isFrontendOnly()) {
    return getMockRecommendedEvents(limit);
  }

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    });

    if (user?.interests.length) {
      return prisma.event.findMany({
        where: {
          status: "PUBLISHED",
          startDate: { gte: new Date() },
          OR: [
            { tags: { hasSome: user.interests } },
            { category: { slug: { in: user.interests } } },
          ],
        },
        take: limit,
        orderBy: { viewCount: "desc" },
        include: {
          category: true,
          venue: { select: { city: true } },
          ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
        },
      });
    }
  }

  return prisma.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() } },
    take: limit,
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
    include: {
      category: true,
      venue: { select: { city: true } },
      ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });
}

export async function getSimilarEvents(eventId: string, categoryId: string, limit = 4) {
  if (isFrontendOnly()) {
    return getMockSimilarEvents(eventId, categoryId, limit);
  }

  return prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      categoryId,
      id: { not: eventId },
      startDate: { gte: new Date() },
    },
    take: limit,
    orderBy: { viewCount: "desc" },
    include: {
      category: true,
      venue: { select: { city: true } },
      ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });
}

export async function globalSearch(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return { events: [], organizers: [], exhibitors: [], venues: [] };

  const [events, organizers, exhibitors, venues] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, title: true, slug: true, banner: true, startDate: true },
    }),
    prisma.user.findMany({
      where: {
        role: "ORGANIZER",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, name: true, image: true, company: true },
    }),
    prisma.exhibitor.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, companyName: true, slug: true, logo: true },
    }),
    prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, name: true, slug: true, city: true, images: true },
    }),
  ]);

  return { events, organizers, exhibitors, venues };
}

export async function getOrganizerStats(organizerId: string) {
  const [totalEvents, upcomingEvents, bookings, revenue] = await Promise.all([
    prisma.event.count({ where: { organizerId } }),
    prisma.event.count({
      where: { organizerId, status: "PUBLISHED", startDate: { gte: new Date() } },
    }),
    prisma.booking.count({
      where: { event: { organizerId }, status: "CONFIRMED" },
    }),
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        booking: { event: { organizerId } },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalEvents,
    upcomingEvents,
    ticketsSold: bookings,
    revenue: revenue._sum.amount?.toNumber() ?? 0,
  };
}

export async function getAdminStats() {
  const [users, events, bookings, organizers, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.user.count({ where: { role: "ORGANIZER" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  return {
    users,
    events,
    bookings,
    organizers,
    revenue: revenue._sum.amount?.toNumber() ?? 0,
  };
}
