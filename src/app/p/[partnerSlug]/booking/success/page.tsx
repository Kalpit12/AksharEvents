import { prisma } from "@/lib/prisma";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import { RegistrationConfirmedPanel } from "@/components/registration/registration-confirmed-panel";
import { getPartnerBySlug } from "@/lib/partners";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registration Confirmed",
};

export default async function PartnerBookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ partnerSlug: string }>;
  searchParams: Promise<{ booking?: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const { booking: bookingNumber } = await searchParams;

  const booking = bookingNumber
    ? await prisma.booking.findUnique({
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
        },
      })
    : null;

  const qrDataUrl =
    booking && booking.status === "CONFIRMED"
      ? await generateQRCodeDataUrl(getTicketQRPayload(booking.bookingNumber, booking.eventId))
      : null;

  const primaryTicket = booking?.items[0]?.ticketType;
  const passLabel = primaryTicket
    ? getPassBadgeLabel(primaryTicket.name, primaryTicket.tier)
    : "VISITOR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      {booking && qrDataUrl ? (
        <RegistrationConfirmedPanel
          attendeeName={booking.attendeeName}
          attendeeEmail={booking.attendeeEmail}
          attendeeDesignation={booking.attendeeDesignation}
          bookingNumber={booking.bookingNumber}
          qrDataUrl={qrDataUrl}
          passLabel={passLabel}
          event={{
            title: booking.event.title,
            slug: booking.event.slug,
            startDate: booking.event.startDate,
            endDate: booking.event.endDate,
            startTime: booking.event.startTime,
            endTime: booking.event.endTime,
            venueName: booking.event.venue?.name,
            venueCity: booking.event.venue?.city,
          }}
        />
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">
            Thank you for your booking with {partner.name}. Check your email for confirmation.
          </p>
        </div>
      )}
    </div>
  );
}
