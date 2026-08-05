import type { Metadata } from "next";
import Link from "next/link";
import { BookingInquiryForm } from "@/components/inquiries/booking-inquiry-form";

export const metadata: Metadata = {
  title: "Booking & Inquiries",
  description: "Plan your event with AxarEvents. Submit a booking or inquiry and our team will get back to you.",
};

export default function BookingInquiriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Plan an Event</h1>
      <p className="text-muted-foreground mb-4 max-w-3xl">
        Tell us about your meeting, conference, expo, or other MICE-style business event. We help
        with venues (including community halls and centres), ticketing, exhibitor setup, and
        full event management.
      </p>
      <p className="text-sm text-muted-foreground mb-10">
        For weddings and purely social celebrations, please{" "}
        <Link href="/contact" className="text-primary hover:underline">
          contact us
        </Link>{" "}
        to confirm scope — our core focus is corporate and industry events.
      </p>

      <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
        <BookingInquiryForm />
      </div>
    </div>
  );
}
