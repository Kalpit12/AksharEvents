import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { formatEventDateRange, formatEventTimings, formatEventVenue } from "@/lib/event-schedule-label";
import { EventVisitorBadge } from "@/components/pass/digital-pass-card";
import { BadgeDownloadButton } from "@/components/pass/badge-download-button";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visitor Badge",
  robots: { index: false, follow: false },
};

interface PassPageProps {
  params: Promise<{ bookingNumber: string }>;
}

export default async function VisitorPassPage({ params }: PassPageProps) {
  const { bookingNumber } = await params;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venue: { select: { name: true, city: true } },
        },
      },
      items: { include: { ticketType: true } },
      attendance: true,
    },
  });

  if (!booking) notFound();

  const isConfirmed = booking.status === "CONFIRMED";
  const qrDataUrl = isConfirmed
    ? await generateQRCodeDataUrl(getTicketQRPayload(booking.bookingNumber, booking.eventId))
    : null;

  const primaryTicket = booking.items[0]?.ticketType;
  const passLabel = getPassBadgeLabel(primaryTicket?.name, primaryTicket?.tier);
  const dateLabel = formatEventDateRange(booking.event.startDate, booking.event.endDate);
  const timeLabel = formatEventTimings(booking.event.startTime, booking.event.endTime);
  const venue = formatEventVenue(booking.event.venue?.name, booking.event.venue?.city);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <Badge variant={isConfirmed ? "default" : "secondary"} className="mb-3">
          {isConfirmed ? "Confirmed badge" : booking.status}
        </Badge>
        <h1 className="text-2xl font-bold">Your event badge</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show this badge at the entrance — or download it for offline use.
        </p>
      </div>

      {isConfirmed && (
        <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">{booking.event.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {dateLabel}
          </p>
          {timeLabel && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {timeLabel}
            </p>
          )}
          {venue && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {venue}
            </p>
          )}
        </div>
      )}

      {isConfirmed && qrDataUrl ? (
        <div className="mx-auto w-full max-w-[340px]">
          <EventVisitorBadge
            attendeeName={booking.attendeeName}
            attendeeDesignation={booking.attendeeDesignation}
            bookingNumber={booking.bookingNumber}
            qrDataUrl={qrDataUrl}
            passLabel={passLabel}
            event={{
              title: booking.event.title,
              startDate: booking.event.startDate,
              endDate: booking.event.endDate,
              venueName: booking.event.venue?.name,
              venueCity: booking.event.venue?.city,
            }}
          />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <BadgeDownloadButton bookingNumber={booking.bookingNumber} className="w-full" />
            <Button asChild variant="outline" className="w-full">
              <Link href={`/events/${booking.event.slug}`}>
                <Calendar className="h-4 w-4" />
                Event details
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
          <p className="font-medium">Badge not yet available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your registration is {booking.status.toLowerCase()}. Complete payment or wait for confirmation.
          </p>
        </div>
      )}

      {(booking.checkedIn || booking.attendance) && (
        <div className="mx-auto mt-4 max-w-[340px] rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-800">
          Checked in
          {(booking.checkedInAt ?? booking.attendance?.checkedInAt) && (
            <span className="block text-xs opacity-80">
              {new Date(booking.checkedInAt ?? booking.attendance!.checkedInAt).toLocaleString("en-KE")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
