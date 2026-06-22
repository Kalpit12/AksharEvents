import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Confirmed",
};

interface BookingSuccessProps {
  searchParams: Promise<{ booking?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessProps) {
  const { booking: bookingNumber } = await searchParams;

  const booking = bookingNumber
    ? await prisma.booking.findUnique({
        where: { bookingNumber },
        include: { event: { select: { title: true, slug: true, startDate: true } } },
      })
    : null;

  const qrDataUrl = booking
    ? await generateQRCodeDataUrl(getTicketQRPayload(booking.bookingNumber, booking.eventId))
    : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
      <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600 sm:h-16 sm:w-16" />
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Booking Confirmed!</h1>

      {booking ? (
        <>
          <p className="text-muted-foreground mb-6">
            Your tickets for <strong>{booking.event.title}</strong> are confirmed.
          </p>
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Booking Number</p>
              <p className="text-xl font-bold font-mono">{booking.bookingNumber}</p>
              {qrDataUrl && (
                <div className="mt-4">
                  <img src={qrDataUrl} alt="QR Ticket" className="mx-auto w-48 h-48 rounded-xl" />
                  <p className="text-xs text-muted-foreground mt-2">Show this QR code at the event entrance</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild><Link href="/events">Browse More Events</Link></Button>
            <Button variant="outline" asChild><Link href={`/events/${booking.event.slug}`}>Event Details</Link></Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Thank you for your booking. Check your email for confirmation.</p>
      )}
    </div>
  );
}
