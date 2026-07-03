import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import { auth } from "@/lib/auth";
import { pickVisitorTicketType } from "@/lib/visitor-pass";
import { uniqueTicketTypes } from "@/lib/event-detail-utils";
import { VisitorRegistrationForm } from "@/components/registration/visitor-registration-form";
import type { Metadata } from "next";

interface RegisterPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Register" };

  return {
    title: `Register to Visit — ${event.title}`,
    description: `Get your visitor badge for ${event.title}. Register with name, company, and designation.`,
  };
}

export default async function EventRegisterPage({ params }: RegisterPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "PUBLISHED") notFound();

  const rawTickets = uniqueTicketTypes([...event.ticketTypes]);
  const ticketTypes = rawTickets.map((t) => ({
    id: t.id,
    name: t.name,
    price:
      typeof t.price === "object" && t.price !== null && "toNumber" in t.price
        ? t.price.toNumber()
        : Number(t.price),
  }));
  const visitorTicket = pickVisitorTicketType(ticketTypes);

  if (!visitorTicket) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Registration unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This event does not have visitor registration open yet.
        </p>
      </div>
    );
  }

  const fullTicket = rawTickets.find((t) => t.id === visitorTicket.id)!;
  const available = fullTicket.quantity - fullTicket.sold;
  if (available <= 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Registration full</h1>
        <p className="mt-2 text-muted-foreground">
          Visitor passes for {event.title} are sold out.
        </p>
      </div>
    );
  }

  const session = await auth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 text-center lg:text-left">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Visitor registration</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{event.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Register to receive your digital event badge with a unique QR code for fast check-in at the expo.
        </p>
      </div>

      <VisitorRegistrationForm
        eventId={event.id}
        eventSlug={event.slug}
        eventTitle={event.title}
        ticketTypeId={fullTicket.id}
        ticketName={fullTicket.name}
        ticketTier={fullTicket.tier}
        ticketPrice={
          typeof fullTicket.price === "object" && fullTicket.price !== null && "toNumber" in fullTicket.price
            ? fullTicket.price.toNumber()
            : Number(fullTicket.price)
        }
        eventBadge={{
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          venueName: event.venue?.name,
          venueCity: event.venue?.city,
        }}
        defaultName={session?.user?.name ?? ""}
        defaultEmail={session?.user?.email ?? ""}
      />
    </div>
  );
}
