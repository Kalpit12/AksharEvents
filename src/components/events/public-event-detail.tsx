import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventBySlug, getSimilarEvents } from "@/lib/events";
import { isFrontendOnly } from "@/lib/frontend-only";
import { prisma } from "@/lib/prisma";
import { SafeImage } from "@/components/ui/SafeImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { pickVisitorTicketType } from "@/lib/visitor-pass";
import { EventCard } from "@/components/events/event-card";
import { CountdownTimer } from "@/components/events/countdown-timer";
import { formatDate } from "@/lib/utils";
import {
  Calendar, MapPin, Users, BadgeCheck,
  Mic, Building2, HelpCircle, Star, IdCard,
} from "lucide-react";
import {
  descriptionWithoutShortLead,
  uniqueAgendaItems,
  uniqueFaqs,
  uniqueGalleryImages,
  uniqueSpeakers,
  uniqueTicketTypes,
} from "@/lib/event-detail-utils";
import { PublicEventScheduleSection } from "@/components/events/public-event-schedule";

export async function PublicEventDetail({
  slug,
  partnerId,
  eventsBasePath = "/events",
}: {
  slug: string;
  partnerId?: string;
  eventsBasePath?: string;
}) {
  const event = await getEventBySlug(slug, partnerId);
  if (!event || event.status !== "PUBLISHED") notFound();

  if (!isFrontendOnly()) {
    await prisma.event.update({
      where: { id: event.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  const similar = await getSimilarEvents(event.id, event.categoryId);
  const speakers = uniqueSpeakers(event.speakers);
  const agenda = uniqueAgendaItems(event.agenda);
  const gallery = uniqueGalleryImages(event.gallery, event.banner);
  const faqs = uniqueFaqs(event.faqs);
  const description = descriptionWithoutShortLead(event.description, event.shortDescription);
  const scheduleItems =
    "scheduleItems" in event && Array.isArray(event.scheduleItems)
      ? event.scheduleItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? null,
          speaker: item.speaker ?? null,
          speakerImageUrl:
            "speakerImageUrl" in item && typeof item.speakerImageUrl === "string"
              ? item.speakerImageUrl
              : null,
          startAt: item.startAt,
          endAt: item.endAt ?? null,
          location: item.location ?? null,
        }))
      : [];

  const avgRating = event.reviews.length
    ? event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length
    : 0;

  type EventTicketType = (typeof event.ticketTypes)[number];
  const ticketTypes = uniqueTicketTypes(event.ticketTypes as EventTicketType[]).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    tier: String(t.tier),
    price:
      typeof t.price === "object" && t.price !== null && "toNumber" in t.price
        ? t.price.toNumber()
        : Number(t.price),
    quantity: t.quantity,
    sold: t.sold,
    maxPerOrder: t.maxPerOrder,
    minPerOrder: t.minPerOrder,
  }));

  const visitorTicket = pickVisitorTicketType(ticketTypes);
  const registerHref = `${eventsBasePath}/${event.slug}/register`;

  return (
    <>
      <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
        <SafeImage src={event.banner} alt={event.title} fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="default">{event.category.name}</Badge>
              <Badge variant="outline" className="border-white/30 text-white">{event.format.replace("_", " ")}</Badge>
              {event.isFeatured && <Badge variant="accent">Featured</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl xl:text-5xl">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" />{formatDate(event.startDate)} — {formatDate(event.endDate)}</span>
              {event.venue && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{event.venue.name}, {event.venue.city}</span>
              )}
              {"capacity" in event && event.capacity != null && event.capacity > 0 && (
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{event.capacity.toLocaleString()} capacity</span>
              )}
              {avgRating > 0 && (
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{avgRating.toFixed(1)} ({event._count.reviews} reviews)</span>
              )}
            </div>

            {new Date(event.startDate) > new Date() && (
              <div className="rounded-2xl bg-muted p-6">
                <h3 className="mb-3 font-semibold">Event Starts In</h3>
                <CountdownTimer targetDate={event.startDate} />
              </div>
            )}

            <section>
              <h2 className="mb-3 text-xl font-bold">About This Event</h2>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground">
                {description}
              </div>
            </section>

            {(scheduleItems.length > 0 || agenda.length > 0) && (
              <PublicEventScheduleSection scheduleItems={scheduleItems} agenda={agenda} />
            )}

            {speakers.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Mic className="h-5 w-5 text-primary" />Speakers</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="flex gap-4 rounded-xl border border-border p-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                        <SafeImage src={speaker.image} alt={speaker.name} fill />
                      </div>
                      <div>
                        <p className="font-semibold">{speaker.name}</p>
                        {speaker.title && <p className="text-sm text-primary">{speaker.title}</p>}
                        {speaker.company && <p className="text-sm text-muted-foreground">{speaker.company}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {event.exhibitors.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Building2 className="h-5 w-5 text-primary" />Exhibitors</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {event.exhibitors.map((ee) => (
                    <div key={ee.id} className="rounded-xl border border-border p-4">
                      <p className="font-medium">{ee.exhibitor.companyName}</p>
                      {ee.boothNumber && <p className="text-sm text-muted-foreground">Booth {ee.boothNumber}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {gallery.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Gallery</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl">
                      <SafeImage src={img.url} alt={img.caption || ""} fill />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><HelpCircle className="h-5 w-5 text-primary" />FAQs</h2>
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="rounded-xl border border-border p-4">
                      <p className="font-medium">{faq.question}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border p-6">
              <h2 className="mb-3 text-lg font-bold">Organized By</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
                  <SafeImage src={event.organizer.image} alt={event.organizer.name || ""} fill />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {event.organizer.name}
                    {event.organizer.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </p>
                  {event.organizer.company && <p className="text-sm text-muted-foreground">{event.organizer.company}</p>}
                </div>
              </div>
            </section>
          </div>

          <div className="order-1 space-y-4 lg:order-2">
            {visitorTicket && (
              <Card className="border-champagne/30 bg-gradient-to-br from-card to-muted/30 lg:sticky lg:top-24">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Register to visit</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get your personalised badge with name, designation, and QR code for expo check-in.
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link href={registerHref}>Get my visitor badge</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="mb-6 text-2xl font-bold">Similar Events</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((e) => (
                <EventCard key={e.id} event={e} eventsBasePath={eventsBasePath} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
