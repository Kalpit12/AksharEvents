import { redirect } from "next/navigation";
import { loadPartnerOrganizerDashboard } from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { PartnerOrganizerDashboard } from "@/components/partner/partner-organizer-dashboard";

export const dynamic = "force-dynamic";

function mailNotice(mail: string | undefined) {
  if (mail === "sent") return "Payment confirmation email sent with login credentials and additional services link.";
  if (mail === "booth-sent") return "Exhibitor added and booth reservation email sent.";
  if (mail === "booth-taken") return "That booth is already reserved or occupied. Choose another booth.";
  if (mail === "invalid-booth") return "Unknown booth code. Check the floor plan and try again.";
  if (mail === "invalid-event") return "Selected event is not available for this partner.";
  if (mail === "duplicate") return "This exhibitor is already registered for the selected event.";
  if (mail === "missing-user") return "Cannot send mail: exhibitor email is missing.";
  if (mail === "denied") return "You do not have permission to manage this partner organizer dashboard.";
  if (mail === "error") return "Could not process the request. Please try again.";
  return null;
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
  const initialTab = tab === "list" ? "list" : "add";

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
    <PartnerOrganizerDashboard
      partnerSlug={partnerSlug}
      partnerName={data.partner.name}
      events={data.events}
      rows={data.rows}
      boothOptionsByEvent={data.boothOptionsByEvent}
      notice={mailNotice(mail)}
      initialTab={initialTab}
    />
  );
}
