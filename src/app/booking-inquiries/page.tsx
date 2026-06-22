import type { Metadata } from "next";
import { BookingInquiryForm } from "@/components/inquiries/booking-inquiry-form";

export const metadata: Metadata = {
  title: "Booking & Inquiries",
  description: "Plan your event with AksharEvents. Submit a booking or inquiry and our team will get back to you.",
};

export default function BookingInquiriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Plan an Event</h1>
      <p className="text-muted-foreground mb-10">
        Tell us about your event and we&apos;ll help you with venues, ticketing, and more.
      </p>

      <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
        <BookingInquiryForm />
      </div>
    </div>
  );
}
