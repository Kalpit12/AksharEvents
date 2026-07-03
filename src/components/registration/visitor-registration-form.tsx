"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBooking } from "@/lib/actions";
import { visitorRegistrationSchema } from "@/lib/validations";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import type { EventBadgeEventInfo } from "@/components/pass/digital-pass-card";
import { VisitorBadgeProfilePreview } from "@/components/pass/visitor-badge-profile-preview";
import { VISITOR_SECTORS } from "@/lib/visitor-sectors";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card as RegistrationCard,
  CardContent as RegistrationCardContent,
  CardDescription as RegistrationCardDescription,
  CardHeader as RegistrationCardHeader,
  CardTitle as RegistrationCardTitle,
} from "@/components/ui/Card";
import { toast } from "sonner";
import { ArrowLeft, IdCard, Sparkles } from "lucide-react";
import Link from "next/link";

type FormValues = {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeCompany: string;
  attendeeDesignation: string;
  attendeeSector: string;
};

type Props = {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketName: string;
  ticketTier: string;
  ticketPrice: number;
  eventBadge: EventBadgeEventInfo;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
};

export function VisitorRegistrationForm({
  eventId,
  eventSlug,
  eventTitle,
  ticketTypeId,
  ticketName,
  ticketTier,
  ticketPrice,
  eventBadge,
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      visitorRegistrationSchema.omit({ eventId: true, ticketTypeId: true })
    ),
    defaultValues: {
      attendeeName: defaultName,
      attendeeEmail: defaultEmail,
      attendeePhone: defaultPhone,
      attendeeCompany: "",
      attendeeDesignation: "",
      attendeeSector: "",
    },
  });

  const watched = useWatch({ control });
  const passLabel = getPassBadgeLabel(ticketName, ticketTier);

  const selectClassName = cn(
    "flex h-10 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm text-card-foreground shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat",
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
  );

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const result = await createBooking({
      eventId,
      items: [{ ticketTypeId, quantity: 1 }],
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      attendeePhone: data.attendeePhone,
      attendeeCompany: data.attendeeCompany,
      attendeeDesignation: data.attendeeDesignation,
      attendeeSector: data.attendeeSector,
    });
    setLoading(false);

    if (result.error) {
      if (result.alreadyRegistered && result.bookingNumber) {
        toast.info("You're already registered for this event. Opening your badge…");
        router.push(`/pass/${result.bookingNumber}`);
        return;
      }
      toast.error(result.error);
      return;
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    toast.success("Registration complete! Your badge is ready.");
    router.push(`/booking/success?booking=${result.bookingNumber}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
      <RegistrationCard>
        <RegistrationCardHeader>
          <div className="mb-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
              <Link href={`/events/${eventSlug}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to event
              </Link>
            </Button>
          </div>
          <RegistrationCardTitle className="flex items-center gap-2 text-xl">
            <IdCard className="h-5 w-5 text-primary" />
            Register to visit
          </RegistrationCardTitle>
          <RegistrationCardDescription>
            Complete the form for <strong>{eventTitle}</strong>. Your personalised AksharEvents badge
            updates live alongside as you type.
          </RegistrationCardDescription>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="font-medium">{ticketName}</span>
            <span className="text-primary font-semibold">
              {ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)}
            </span>
          </div>
        </RegistrationCardHeader>
        <RegistrationCardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="attendeeName">Full name *</Label>
                <Input id="attendeeName" {...register("attendeeName")} className="mt-1" placeholder="John Doe" />
                {errors.attendeeName && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeeName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="attendeeEmail">Email *</Label>
                <Input
                  id="attendeeEmail"
                  type="email"
                  {...register("attendeeEmail")}
                  className="mt-1"
                  placeholder="you@company.com"
                />
                {errors.attendeeEmail && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeeEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="attendeePhone">Phone number *</Label>
                <Input
                  id="attendeePhone"
                  type="tel"
                  {...register("attendeePhone")}
                  className="mt-1"
                  placeholder="+254 7XX XXX XXX"
                />
                {errors.attendeePhone && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeePhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="attendeeCompany">Company *</Label>
                <Input
                  id="attendeeCompany"
                  {...register("attendeeCompany")}
                  className="mt-1"
                  placeholder="Acme Ltd"
                />
                {errors.attendeeCompany && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeeCompany.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="attendeeDesignation">Designation *</Label>
                <Input
                  id="attendeeDesignation"
                  {...register("attendeeDesignation")}
                  className="mt-1"
                  placeholder="Marketing Manager"
                />
                {errors.attendeeDesignation && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeeDesignation.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="attendeeSector">Sector *</Label>
                <select
                  id="attendeeSector"
                  {...register("attendeeSector")}
                  className={cn(selectClassName, "mt-1", !watched.attendeeSector && "text-muted-foreground")}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select your industry sector
                  </option>
                  {VISITOR_SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
                {errors.attendeeSector && (
                  <p className="mt-1 text-xs text-red-500">{errors.attendeeSector.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "Registering…"
                : ticketPrice === 0
                  ? "Complete registration & get badge"
                  : `Continue to payment — ${formatCurrency(ticketPrice)}`}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By registering you agree to share your details with the event organiser for check-in purposes.
            </p>
          </form>
        </RegistrationCardContent>
      </RegistrationCard>

      <RegistrationCard className="flex h-full flex-col lg:sticky lg:top-24">
        <RegistrationCardHeader className="pb-4">
          <RegistrationCardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-champagne" />
            Live badge preview
          </RegistrationCardTitle>
          <RegistrationCardDescription>
            Name and designation update as you type. Your unique QR code is generated when you submit.
          </RegistrationCardDescription>
        </RegistrationCardHeader>
        <RegistrationCardContent className="flex flex-1 flex-col items-center justify-center pt-0">
          <VisitorBadgeProfilePreview
            attendeeName={watched.attendeeName ?? ""}
            attendeeDesignation={watched.attendeeDesignation ?? ""}
            bookingNumber=""
            passLabel={passLabel}
            event={eventBadge}
          />
        </RegistrationCardContent>
      </RegistrationCard>
    </div>
  );
}
