"use client";

import { useState } from "react";
import { toast } from "sonner";
import { submitPartnerEnquiry } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";

export function PartnerEnquiryForm({
  partnerSlug,
  partnerName,
}: {
  partnerSlug: string;
  partnerName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitPartnerEnquiry(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Enquiry sent! The ${partnerName} team will get back to you shortly.`);
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="partnerSlug" value={partnerSlug} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="enquiry-name">Name *</Label>
          <Input id="enquiry-name" name="name" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="enquiry-email">Email *</Label>
          <Input
            id="enquiry-email"
            name="email"
            type="email"
            required
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="enquiry-phone">Phone</Label>
        <Input id="enquiry-phone" name="phone" type="tel" className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="enquiry-subject">Subject *</Label>
        <Input id="enquiry-subject" name="subject" required className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="enquiry-message">Message *</Label>
        <Textarea
          id="enquiry-message"
          name="message"
          required
          rows={5}
          className="mt-1.5"
          placeholder={`How can ${partnerName} help you?`}
        />
      </div>

      <Button type="submit" disabled={loading} size="lg">
        {loading ? "Sending..." : "Send enquiry"}
      </Button>
    </form>
  );
}
