"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAtKiosk, type KioskRegisterResult } from "@/lib/booth-kiosk-actions";
import { visitorRegistrationSchema } from "@/lib/validations";
import { getPassBadgeLabel } from "@/lib/pass-badge";
import type { EventBadgeEventInfo } from "@/components/pass/digital-pass-card";
import { VisitorBadgeProfilePreview } from "@/components/pass/visitor-badge-profile-preview";
import { RegistrationConfirmedPanel } from "@/components/registration/registration-confirmed-panel";
import { VISITOR_SECTORS } from "@/lib/visitor-sectors";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { CheckCircle, IdCard, Sparkles, XCircle } from "lucide-react";

type FormValues = {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeCompany: string;
  attendeeDesignation: string;
  attendeeSector: string;
};

type Props = {
  eventSlug: string;
  eventId: string;
  eventTitle: string;
  eventBadge: EventBadgeEventInfo;
  ticketName: string;
  ticketTier: string;
  ticketPrice: number;
};

const formSchema = visitorRegistrationSchema.omit({ eventId: true, ticketTypeId: true });

export function BoothKioskRegisterForm({
  eventSlug,
  eventId,
  eventTitle,
  eventBadge,
  ticketName,
  ticketTier,
  ticketPrice,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KioskRegisterResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendeeName: "",
      attendeeEmail: "",
      attendeePhone: "",
      attendeeCompany: "",
      attendeeDesignation: "",
      attendeeSector: "",
    },
  });

  const watched = useWatch({ control });
  const passLabel = getPassBadgeLabel(ticketName, ticketTier);

  const selectClassName = cn(
    "mt-1 flex h-10 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-base text-card-foreground shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat",
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
  );

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setResult(null);
    const res = await registerAtKiosk(eventSlug, eventId, data);
    setLoading(false);
    setResult(res);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }

    if ("requiresPayment" in res) {
      toast.info("Redirecting to complete payment…");
      window.location.href = res.checkoutUrl;
      return;
    }

    if (res.alreadyRegistered) {
      toast.info("Already registered — badge shown below");
    } else {
      toast.success("Registered! Badge sent by email.");
      reset();
    }
  };

  if (result && "success" in result && result.success) {
    return (
      <div className="space-y-4">
        <RegistrationConfirmedPanel
          attendeeName={result.visitor.name}
          attendeeEmail={result.visitor.email}
          attendeeDesignation={result.visitor.designation}
          bookingNumber={result.bookingNumber}
          qrDataUrl={result.qrDataUrl}
          passLabel={result.passLabel}
          event={{
            title: eventBadge.title,
            slug: eventSlug,
            startDate: eventBadge.startDate,
            endDate: eventBadge.endDate,
            venueName: eventBadge.venueName,
            venueCity: eventBadge.venueCity,
          }}
        />
        <Button type="button" variant="outline" className="w-full" onClick={() => setResult(null)}>
          Register another visitor
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IdCard className="h-5 w-5 text-primary" />
            Register visitor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Register a walk-in visitor for <strong>{eventTitle}</strong>.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="font-medium">{ticketName}</span>
            <span className="font-semibold text-primary">
              {ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="booth-attendeeName">Full name *</Label>
              <Input
                id="booth-attendeeName"
                {...register("attendeeName")}
                className="mt-1 text-base"
                placeholder="John Doe"
              />
              {errors.attendeeName && (
                <p className="mt-1 text-xs text-red-500">{errors.attendeeName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booth-attendeeEmail">Email *</Label>
              <Input
                id="booth-attendeeEmail"
                type="email"
                {...register("attendeeEmail")}
                className="mt-1 text-base"
                placeholder="you@company.com"
              />
              {errors.attendeeEmail && (
                <p className="mt-1 text-xs text-red-500">{errors.attendeeEmail.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booth-attendeePhone">Phone *</Label>
              <Input
                id="booth-attendeePhone"
                type="tel"
                {...register("attendeePhone")}
                className="mt-1 text-base"
                placeholder="+254 7XX XXX XXX"
              />
              {errors.attendeePhone && (
                <p className="mt-1 text-xs text-red-500">{errors.attendeePhone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booth-attendeeCompany">Company *</Label>
              <Input
                id="booth-attendeeCompany"
                {...register("attendeeCompany")}
                className="mt-1 text-base"
                placeholder="Acme Ltd"
              />
              {errors.attendeeCompany && (
                <p className="mt-1 text-xs text-red-500">{errors.attendeeCompany.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booth-attendeeDesignation">Designation *</Label>
              <Input
                id="booth-attendeeDesignation"
                {...register("attendeeDesignation")}
                className="mt-1 text-base"
                placeholder="Marketing Manager"
              />
              {errors.attendeeDesignation && (
                <p className="mt-1 text-xs text-red-500">{errors.attendeeDesignation.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="booth-attendeeSector">Sector *</Label>
              <select
                id="booth-attendeeSector"
                {...register("attendeeSector")}
                className={selectClassName}
                defaultValue=""
              >
                <option value="" disabled>
                  Select industry sector
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "Registering…"
                : ticketPrice === 0
                  ? "Register & send badge"
                  : `Register — ${formatCurrency(ticketPrice)}`}
            </Button>
          </form>

          {result && "error" in result && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {result.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-champagne" />
            Live badge preview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Updates as you type. The same badge is emailed to the visitor after registration.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-0">
          <VisitorBadgeProfilePreview
            attendeeName={watched.attendeeName ?? ""}
            attendeeDesignation={watched.attendeeDesignation ?? ""}
            bookingNumber=""
            passLabel={passLabel}
            event={eventBadge}
          />
          <p className="mt-4 flex items-center gap-1.5 text-center text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            QR code is generated when registration completes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
