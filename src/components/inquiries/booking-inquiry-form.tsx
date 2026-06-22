"use client";

import { useState } from "react";
import { toast } from "sonner";
import { submitBookingInquiry } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import { EVENT_FORMATS } from "@/lib/utils";

const TITLE_OPTIONS = [
  { value: "", label: "Select title" },
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
  { value: "Dr.", label: "Dr." },
  { value: "Prof.", label: "Prof." },
];

const SERVICE_OPTIONS = [
  { value: "catering", label: "Catering" },
  { value: "av-equipment", label: "AV Equipment" },
  { value: "photography", label: "Photography & Video" },
  { value: "staffing", label: "Event Staffing" },
  { value: "full-management", label: "Full Event Management" },
  { value: "brandings", label: "Brandings" },
  { value: "hoardings", label: "Hoardings" },
  { value: "logistics-transport", label: "Logistics & Transport" },
];

const COUNTRY_OPTIONS = [
  { value: "", label: "Select country" },
  { value: "Kenya", label: "Kenya" },
  { value: "Uganda", label: "Uganda" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "South Africa", label: "South Africa" },
  { value: "Ghana", label: "Ghana" },
  { value: "Other", label: "Other" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "Select event type" },
  ...EVENT_FORMATS.map((f) => ({ value: f.label, label: f.label })),
];

export function BookingInquiryForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitBookingInquiry(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Inquiry sent! Our team will get back to you shortly.");
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
        <div className="space-y-5">
          <div>
            <Label htmlFor="eventType">Event type *</Label>
            <Select
              id="eventType"
              name="eventType"
              required
              options={EVENT_TYPE_OPTIONS}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start date *</Label>
              <Input id="startDate" name="startDate" type="date" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="endDate">End date *</Label>
              <Input id="endDate" name="endDate" type="date" required className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="expectedAttendees">How many attendees are expected? *</Label>
            <Input
              id="expectedAttendees"
              name="expectedAttendees"
              type="number"
              min={1}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Would you like additional services?</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Select all that apply (optional)</p>
            <div className="mt-1 rounded-lg border border-border bg-muted/50 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_OPTIONS.map((service) => (
                  <label
                    key={service.value}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-card-foreground cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      name="additionalServices"
                      value={service.value}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{service.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Your Title *</Label>
            <Select
              id="title"
              name="title"
              required
              options={TITLE_OPTIONS}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name *</Label>
              <Input id="firstName" name="firstName" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="lastName">Last name *</Label>
              <Input id="lastName" name="lastName" required className="mt-1" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>

          <div>
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" name="contactNumber" type="tel" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="organization">Organization / Company *</Label>
            <Input id="organization" name="organization" required className="mt-1" />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              id="country"
              name="country"
              required
              options={COUNTRY_OPTIONS}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" name="message" required rows={8} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-end gap-3 border-t border-border pt-2 sm:flex-row">
        <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
}
