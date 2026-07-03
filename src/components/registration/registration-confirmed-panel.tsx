import Link from "next/link";
import { EventVisitorBadge } from "@/components/pass/digital-pass-card";
import { BadgeDownloadButton } from "@/components/pass/badge-download-button";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatEventDateRange, formatEventTimings, formatEventVenue } from "@/lib/event-schedule-label";
import { Calendar, CheckCircle, Clock, MapPin, Mail } from "lucide-react";

export type RegistrationConfirmedProps = {
  attendeeName: string;
  attendeeEmail: string;
  attendeeDesignation?: string | null;
  bookingNumber: string;
  qrDataUrl: string;
  passLabel: string;
  event: {
    title: string;
    slug: string;
    startDate: Date | string;
    endDate?: Date | string | null;
    startTime?: string | null;
    endTime?: string | null;
    venueName?: string | null;
    venueCity?: string | null;
  };
};

export function RegistrationConfirmedPanel({
  attendeeName,
  attendeeEmail,
  attendeeDesignation,
  bookingNumber,
  qrDataUrl,
  passLabel,
  event,
}: RegistrationConfirmedProps) {
  const dateLabel = formatEventDateRange(event.startDate, event.endDate);
  const timeLabel = formatEventTimings(event.startTime, event.endTime);
  const venue = formatEventVenue(event.venueName, event.venueCity);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600" />
        <Badge className="mb-3">Registration confirmed</Badge>
        <h1 className="text-2xl font-bold sm:text-3xl">You&apos;re registered!</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Your registration for <strong>{event.title}</strong> is confirmed. We&apos;ve sent your
          badge and QR code to <strong>{attendeeEmail}</strong>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Event details
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Event</dt>
              <dd className="font-medium">{event.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{dateLabel}</dd>
            </div>
            {timeLabel && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </dt>
                <dd className="font-medium">{timeLabel}</dd>
              </div>
            )}
            {venue && (
              <div>
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue
                </dt>
                <dd className="font-medium">{venue}</dd>
              </div>
            )}
            <div>
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Confirmation sent to
              </dt>
              <dd className="font-medium">{attendeeEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pass number</dt>
              <dd className="font-mono text-sm">{bookingNumber}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${event.slug}`}>Event details</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/events">Browse events</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[340px]">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
            Your visitor badge
          </p>
          <EventVisitorBadge
            attendeeName={attendeeName}
            attendeeDesignation={attendeeDesignation}
            bookingNumber={bookingNumber}
            qrDataUrl={qrDataUrl}
            passLabel={passLabel}
            event={{
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              venueName: event.venueName,
              venueCity: event.venueCity,
            }}
          />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <BadgeDownloadButton bookingNumber={bookingNumber} className="w-full" />
            <Button asChild variant="outline" className="w-full">
              <Link href={`/pass/${bookingNumber}`}>Open badge page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
