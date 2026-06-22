"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import { createBooking } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Minus, Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingFormProps {
  eventId: string;
  eventSlug: string;
  ticketTypes: {
    id: string;
    name: string;
    description: string | null;
    tier: string;
    price: number;
    quantity: number;
    sold: number;
    maxPerOrder: number;
    minPerOrder: number;
  }[];
  defaultName?: string;
  defaultEmail?: string;
}

export function BookingForm({
  eventId,
  eventSlug,
  ticketTypes,
  defaultName = "",
  defaultEmail = "",
}: BookingFormProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      attendeeName: defaultName,
      attendeeEmail: defaultEmail,
      attendeePhone: "",
    },
  });

  const updateQty = (id: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const items = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  const total = items.reduce((sum, item) => {
    const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId);
    return sum + (ticket ? ticket.price * item.quantity : 0);
  }, 0);

  const onSubmit = async (data: { attendeeName: string; attendeeEmail: string; attendeePhone?: string }) => {
    if (items.length === 0) {
      toast.error("Please select at least one ticket");
      return;
    }

    setLoading(true);
    const result = await createBooking({
      eventId,
      items,
      ...data,
      couponCode: couponCode || undefined,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else {
      toast.success("Booking confirmed!");
      router.push(`/booking/success?booking=${result.bookingNumber}`);
    }
  };

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Book Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {ticketTypes.map((ticket) => {
            const available = ticket.quantity - ticket.sold;
            const qty = quantities[ticket.id] || 0;

            return (
              <div key={ticket.id} className="rounded-lg border border-border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.description}</p>
                    )}
                    <p className="text-sm font-semibold text-primary mt-1">
                      {ticket.price === 0 ? "Free" : formatCurrency(ticket.price)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">{available} remaining</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(ticket.id, -1, ticket.maxPerOrder)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-medium">{qty}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(ticket.id, 1, Math.min(ticket.maxPerOrder, available))}
                      disabled={qty >= ticket.maxPerOrder || qty >= available}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {total > 0 && (
            <div>
              <Label htmlFor="coupon">Coupon Code</Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="mt-1"
              />
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("attendeeName", { required: true })} className="mt-1" />
              {errors.attendeeName && <p className="text-xs text-red-500 mt-1">Name is required</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("attendeeEmail", { required: true })} className="mt-1" />
              {errors.attendeeEmail && <p className="text-xs text-red-500 mt-1">Email is required</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register("attendeePhone")} className="mt-1" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-bold text-primary">
              {total === 0 ? "Free" : formatCurrency(total)}
            </span>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || items.length === 0}>
            {loading ? "Processing..." : total === 0 ? "Confirm Booking" : "Proceed to Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
