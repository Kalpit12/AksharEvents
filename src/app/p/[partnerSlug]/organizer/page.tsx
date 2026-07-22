import { Suspense } from "react";
import { redirect } from "next/navigation";
import { loadPartnerOrganizerDashboard } from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { PartnerOrganizerDashboard } from "@/components/partner/partner-organizer-dashboard";

export const dynamic = "force-dynamic";

function mailNotice(mail: string | undefined): { type: "success" | "error" | "info"; message: string } | null {
  if (mail === "sent") {
    return { type: "success", message: "Login credentials email sent successfully." };
  }
  if (mail === "payment-confirmed") {
    return { type: "success", message: "Payment confirmed and booth status updated." };
  }
  if (mail === "booth-sent") {
    return { type: "success", message: "Exhibitor added and booth reservation email sent." };
  }
  if (mail === "event-created") {
    return {
      type: "success",
      message: "Event created and published. You can now add exhibitors and assign booths.",
    };
  }
  if (mail === "already-paid") {
    return { type: "info", message: "Payment was already confirmed for this exhibitor." };
  }
  if (mail === "payment-pending") {
    return { type: "info", message: "Confirm payment first before sending the login email." };
  }
  if (mail === "booth-taken") {
    return { type: "error", message: "That booth is already reserved or occupied. Choose another booth." };
  }
  if (mail === "invalid-booth") {
    return { type: "error", message: "Unknown booth code. Check the floor plan and try again." };
  }
  if (mail === "invalid-event") {
    return { type: "error", message: "Selected event is not available for this partner." };
  }
  if (mail === "invalid-event-fields") {
    return {
      type: "error",
      message: "Please fill in all required event fields (title, description, category, dates).",
    };
  }
  if (mail === "invalid-event-format") {
    return { type: "error", message: "Choose an event format that supports exhibitor booths." };
  }
  if (mail === "invalid-event-dates") {
    return { type: "error", message: "End date must be on or after the start date." };
  }
  if (mail === "duplicate") {
    return { type: "error", message: "This exhibitor is already registered for the selected event." };
  }
  if (mail === "missing-user") {
    return { type: "error", message: "Cannot send mail: exhibitor email is missing." };
  }
  if (mail === "denied") {
    return { type: "error", message: "You do not have permission to manage this partner organizer dashboard." };
  }
  if (mail === "error") {
    return { type: "error", message: "Could not process the request. Please try again." };
  }
  return null;
}

function resolveInitialTab(tab: string | undefined): "add" | "list" | "events" {
  if (tab === "list" || tab === "events") return tab;
  return "add";
}

export default async function PartnerOrganizerPage({
  params,
  searchParams,
}: {
  params: Promise<{ partnerSlug: string }>;
  searchParams: Promise<{ mail?: string; tab?: string }>;
}) {
  const { partnerSlug } = await params;
  const { mail, tab } = await searchParams;
  const data = await loadPartnerOrganizerDashboard(partnerSlug);
  const initialTab = resolveInitialTab(tab);

  if (data.error === "Sign in required") {
    redirect(partnerPath(partnerSlug, "/organizer/login"));
  }

  if (data.error || !data.partner) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Organizer dashboard unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.error ?? "Partner not found."}</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
        </div>
      }
    >
      <PartnerOrganizerDashboard
        partnerSlug={partnerSlug}
        partnerName={data.partner.name}
        events={data.events}
        rows={data.rows}
        categories={data.categories}
        venues={data.venues}
        boothOptionsByEvent={data.boothOptionsByEvent}
        notice={mailNotice(mail)}
        initialTab={initialTab}
      />
    </Suspense>
  );
}
