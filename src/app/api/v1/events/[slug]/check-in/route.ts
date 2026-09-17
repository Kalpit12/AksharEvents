import { prisma } from "@/lib/prisma";
import {
  assertEventAccess,
  authenticateApiKey,
  jsonApiError,
  jsonApiOk,
  logApiUsage,
  requireScope,
} from "@/lib/developer-api";

type RouteContext = { params: Promise<{ slug: string }> };

/** POST /api/v1/events/{slug}/check-in */
export async function POST(request: Request, context: RouteContext) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const scopeErr = requireScope(auth.key, "checkin:write");
  if (scopeErr) return scopeErr;

  const { slug } = await context.params;

  let body: { bookingNumber?: string };
  try {
    body = await request.json();
  } catch {
    return jsonApiError("Invalid JSON body", 400);
  }

  const bookingNumber = body.bookingNumber?.trim();
  if (!bookingNumber) {
    return jsonApiError("bookingNumber is required", 400);
  }

  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
  });

  if (!event) return jsonApiError("Event not found", 404);

  const accessErr = assertEventAccess(auth.key, event.id);
  if (accessErr) return accessErr;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber },
    include: { attendance: true },
  });

  if (!booking) return jsonApiError("Ticket not found", 404);
  if (booking.eventId !== event.id) {
    return jsonApiError("Ticket is for a different event", 400);
  }
  if (booking.status !== "CONFIRMED") {
    return jsonApiError(`Booking status: ${booking.status}`, 400);
  }

  if (booking.attendance || booking.checkedIn) {
    const checkedInAt =
      booking.attendance?.checkedInAt ?? booking.checkedInAt ?? new Date();
    void logApiUsage({
      apiKeyId: auth.key.id,
      path: `/api/v1/events/${slug}/check-in`,
      method: "POST",
      status: 200,
    });
    return jsonApiOk({
      success: true,
      alreadyCheckedIn: true,
      attendeeName: booking.attendeeName,
      bookingNumber: booking.bookingNumber,
      eventTitle: event.title,
      checkedInAt: checkedInAt.toISOString(),
    });
  }

  const attendance = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
    return tx.attendance.create({
      data: {
        bookingId: booking.id,
        checkedInBy: auth.key.id,
        deviceInfo: "DEVELOPER_API",
      },
    });
  });

  void logApiUsage({
    apiKeyId: auth.key.id,
    path: `/api/v1/events/${slug}/check-in`,
    method: "POST",
    status: 200,
  });

  return jsonApiOk({
    success: true,
    alreadyCheckedIn: false,
    attendeeName: booking.attendeeName,
    bookingNumber: booking.bookingNumber,
    eventTitle: event.title,
    checkedInAt: attendance.checkedInAt.toISOString(),
  });
}
