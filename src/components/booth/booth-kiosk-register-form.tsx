"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAtBooth, type BoothRegisterResult } from "@/lib/booth-kiosk-actions";
import { visitorRegistrationSchema } from "@/lib/validations";
import { VISITOR_SECTORS } from "@/lib/visitor-sectors";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { CheckCircle, IdCard, XCircle } from "lucide-react";

type FormValues = {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeCompany: string;
  attendeeDesignation: string;
  attendeeSector: string;
};

type Props = {
  token: string;
  eventTitle: string;
  ticketName: string;
  ticketPrice: number;
};

const formSchema = visitorRegistrationSchema.omit({ eventId: true, ticketTypeId: true });

export function BoothKioskRegisterForm({ token, eventTitle, ticketName, ticketPrice }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BoothRegisterResult | null>(null);

  const {
    register,
    handleSubmit,
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

  const selectClassName = cn(
    "mt-1 flex h-10 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-base text-card-foreground shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat",
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
  );

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setResult(null);
    const res = await registerAtBooth(token, data);
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
      toast.info("You're already registered — visit recorded at this booth");
    } else {
      toast.success("Registration complete!");
      reset();
    }
  };

  if (result && "success" in result && result.success) {
    return (
      <Card className="border-green-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-8 w-8 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold">
                {result.alreadyRegistered ? "Welcome back!" : "You're registered!"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.alreadyRegistered
                  ? "Your visit at this booth has been recorded."
                  : "Your event pass is ready and your visit at this booth has been recorded."}
              </p>
              <p className="mt-3 font-semibold">{result.visitor.name}</p>
              {result.visitor.designation && (
                <p className="text-sm text-primary">{result.visitor.designation}</p>
              )}
              {result.visitor.company && (
                <p className="text-sm text-muted-foreground">{result.visitor.company}</p>
              )}
              <p className="mt-1 font-mono text-xs">#{result.visitor.bookingNumber}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <a href={`/pass/${result.bookingNumber}`}>View event pass</a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setResult(null)}
                >
                  Register another visitor
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IdCard className="h-5 w-5 text-primary" />
          Register to visit
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Register for <strong>{eventTitle}</strong> at this booth.
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading
              ? "Registering…"
              : ticketPrice === 0
                ? "Register & get pass"
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
  );
}
