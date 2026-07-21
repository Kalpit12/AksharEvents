"use client";

import { useMemo, useState } from "react";
import { createManualPartnerExhibitor, sendPartnerExhibitorPaymentConfirmation } from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { formatDate } from "@/lib/utils";

type PartnerEvent = {
  id: string;
  title: string;
};

type ExhibitorRow = {
  id: string;
  boothNumber: string | null;
  event: { id: string; title: string; slug: string };
  exhibitor: {
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    user: { email: string } | null;
  };
  eventBooth: {
    code: string;
    paymentVerified: boolean;
    paymentVerifiedAt: Date | null;
  } | null;
};

type BoothOption = {
  code: string;
  status: string;
  companyName: string | null;
};

export function PartnerOrganizerDashboard({
  partnerSlug,
  partnerName,
  events,
  rows,
  boothOptionsByEvent,
  notice,
}: {
  partnerSlug: string;
  partnerName: string;
  events: PartnerEvent[];
  rows: ExhibitorRow[];
  boothOptionsByEvent: Record<string, BoothOption[]>;
  notice: string | null;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  const boothOptions = useMemo(() => {
    if (!selectedEventId) return [];
    return boothOptionsByEvent[selectedEventId] ?? [];
  }, [boothOptionsByEvent, selectedEventId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{partnerName} Organizer Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add exhibitors manually after phone bookings, assign booths, and send payment confirmation emails with login credentials.
        </p>
      </div>

      {notice ? (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">{notice}</div>
      ) : null}

      {events.length > 0 ? (
        <section className="mb-8 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Add exhibitor manually</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this after a phone or offline booking. The exhibitor will receive a booth reservation email. Login credentials are sent when you confirm payment.
          </p>
          <form action={createManualPartnerExhibitor} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="partnerSlug" value={partnerSlug} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Event</span>
              <select
                name="eventId"
                required
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Company name</span>
              <input
                name="companyName"
                required
                className="rounded-md border border-border bg-background px-3 py-2"
                placeholder="Acme Ltd"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Contact name</span>
              <input
                name="contactName"
                required
                className="rounded-md border border-border bg-background px-3 py-2"
                placeholder="Jane Doe"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Contact email</span>
              <input
                name="contactEmail"
                type="email"
                required
                className="rounded-md border border-border bg-background px-3 py-2"
                placeholder="jane@acme.com"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Contact phone</span>
              <input
                name="contactPhone"
                className="rounded-md border border-border bg-background px-3 py-2"
                placeholder="+254..."
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Booth code</span>
              <input
                name="boothCode"
                required
                list="partner-booth-codes"
                className="rounded-md border border-border bg-background px-3 py-2 uppercase"
                placeholder="A8"
              />
              <datalist id="partner-booth-codes">
                {boothOptions.map((booth) => (
                  <option
                    key={booth.code}
                    value={booth.code}
                    label={
                      booth.status === "AVAILABLE" || booth.status === "PREMIUM"
                        ? `${booth.code} (available)`
                        : `${booth.code} (${booth.companyName ?? "reserved"})`
                    }
                  />
                ))}
              </datalist>
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-champagne-dark"
              >
                Add exhibitor and reserve booth
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No exhibitors added yet. Use the form above after a phone booking.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Exhibitor</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Booth</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Confirm payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const paymentDone = Boolean(row.eventBooth?.paymentVerified);
                const paymentDate = row.eventBooth?.paymentVerifiedAt
                  ? formatDate(row.eventBooth.paymentVerifiedAt)
                  : null;
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{row.exhibitor.companyName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.exhibitor.contactName || "No contact"} —{" "}
                        {row.exhibitor.contactEmail || row.exhibitor.user?.email || "No email"}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">{row.event.title}</td>
                    <td className="px-4 py-3 align-top">
                      {row.eventBooth?.code || row.boothNumber || "Not assigned"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {paymentDone ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Confirmed{paymentDate ? ` (${paymentDate})` : ""}
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <form
                        action={sendPartnerExhibitorPaymentConfirmation}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="partnerSlug" value={partnerSlug} />
                        <input type="hidden" name="eventExhibitorId" value={row.id} />
                        <input
                          type="text"
                          name="paymentReference"
                          placeholder="Payment ref (optional)"
                          className="w-40 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={paymentDone}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-champagne-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Send payment + login mail
                        </button>
                      </form>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sends payment confirmation, AxarEvents login credentials, and additional services link.
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5">
        <a
          href={partnerPath(partnerSlug)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to partner site
        </a>
      </div>
    </div>
  );
}
