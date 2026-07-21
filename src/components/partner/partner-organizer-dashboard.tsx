"use client";

import { useMemo, useState } from "react";
import { createManualPartnerExhibitor, sendPartnerExhibitorPaymentConfirmation } from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

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

function AddExhibitorForm({
  partnerSlug,
  events,
  boothOptionsByEvent,
}: {
  partnerSlug: string;
  events: PartnerEvent[];
  boothOptionsByEvent: Record<string, BoothOption[]>;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  const boothOptions = useMemo(() => {
    if (!selectedEventId) return [];
    return boothOptionsByEvent[selectedEventId] ?? [];
  }, [boothOptionsByEvent, selectedEventId]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <h3 className="text-base font-semibold">No events available yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish an expo event first, then return here to add exhibitors manually.
        </p>
      </div>
    );
  }

  return (
    <form action={createManualPartnerExhibitor} className="space-y-8">
      <input type="hidden" name="partnerSlug" value={partnerSlug} />

      <fieldset className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
        <legend className="px-1 text-sm font-semibold">Event &amp; booth</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event</Label>
            <select
              id="eventId"
              name="eventId"
              required
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="boothCode">Booth code</Label>
            <Input
              id="boothCode"
              name="boothCode"
              required
              list="partner-booth-codes"
              placeholder="A8"
              className="uppercase"
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
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
        <legend className="px-1 text-sm font-semibold">Exhibitor contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" name="companyName" required placeholder="Acme Ltd" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" name="contactName" required placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              placeholder="jane@acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" name="contactPhone" placeholder="+254..." />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="bg-[var(--partner-primary)] font-semibold text-white hover:opacity-90"
        >
          Add exhibitor and reserve booth
        </Button>
        <p className="text-sm text-muted-foreground">
          Sends a booth reservation email. Login credentials are sent after payment confirmation.
        </p>
      </div>
    </form>
  );
}

export function PartnerOrganizerDashboard({
  partnerSlug,
  partnerName,
  events,
  rows,
  boothOptionsByEvent,
  notice,
  initialTab = "add",
}: {
  partnerSlug: string;
  partnerName: string;
  events: PartnerEvent[];
  rows: ExhibitorRow[];
  boothOptionsByEvent: Record<string, BoothOption[]>;
  notice: string | null;
  initialTab?: "add" | "list";
}) {
  const [activeTab, setActiveTab] = useState<"add" | "list">(initialTab);

  const totalReserved = rows.filter(
    (row) => row.eventBooth && !row.eventBooth.paymentVerified
  ).length;
  const totalPaid = rows.filter((row) => row.eventBooth?.paymentVerified).length;

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

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("add")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "add"
              ? "bg-[var(--partner-primary)] text-white"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          Add Exhibitor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "list"
              ? "bg-[var(--partner-primary)] text-white"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          Exhibitor List ({rows.length})
        </button>
      </div>

      {activeTab === "add" ? (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Add exhibitor manually</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter exhibitor details after a phone or offline booking. Booth reservation email is sent automatically.
          </p>
          <div className="mt-6">
            <AddExhibitorForm
              partnerSlug={partnerSlug}
              events={events}
              boothOptionsByEvent={boothOptionsByEvent}
            />
          </div>
        </section>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No exhibitors added yet.{" "}
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Add your first exhibitor
          </button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Exhibitors</div>
              <div className="mt-1 text-2xl font-semibold">{rows.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Booth Reserved</div>
              <div className="mt-1 text-2xl font-semibold">{totalReserved}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Payment Confirmed</div>
              <div className="mt-1 text-2xl font-semibold">{totalPaid}</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Exhibitor</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Booth</th>
                  <th className="px-4 py-3 font-medium">Booth Status</th>
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
                  const boothStatus = row.eventBooth?.paymentVerified
                    ? "Occupied"
                    : row.eventBooth?.code || row.boothNumber
                      ? "Reserved"
                      : "Not assigned";

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
                        <span className="text-xs font-medium">{boothStatus}</span>
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
                            className="rounded-md bg-[var(--partner-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Send payment + login mail
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
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
