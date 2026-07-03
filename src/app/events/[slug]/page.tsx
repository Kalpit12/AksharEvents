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
import { auth } from "@/lib/auth";
import {
  Calendar, MapPin, Users, Clock, Share2, BadgeCheck,
  Mic, Building2, HelpCircle, Star, IdCard,
} from "lucide-react";
import type { Metadata } from "next";
import {
  descriptionWithoutShortLead,
  uniqueAgendaItems,
  uniqueFaqs,
  uniqueGalleryImages,
  uniqueSpeakers,
  uniqueTicketTypes,
} from "@/lib/event-detail-utils";
import { PublicEventScheduleSection } from "@/components/events/public-event-schedule";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };

  return {
    title: event.title,
    description: event.shortDescription || event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.shortDescription || undefined,
      images: event.banner ? [{ url: event.banner }] : [],
      type: "website",
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status !== "PUBLISHED") notFound();

  const session = await auth();

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
  const ticketTypes = uniqueTicketTypes(
    event.ticketTypes as EventTicketType[]
  ).map((t) => ({
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription || event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue.address,
            addressLocality: event.venue.city,
            addressCountry: "country" in event.venue ? event.venue.country : "Kenya",
          },
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: event.organizer.name,
    },
    image: event.banner,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Banner */}
      <div className="relative h-[40vh] min-h-[300px] max-h-[500px]">
        <SafeImage src={event.banner} alt={event.title} fill priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="default">{event.category.name}</Badge>
              <Badge variant="outline" className="text-white border-white/30">{event.format.replace("_", " ")}</Badge>
              {event.isFeatured && <Badge variant="accent">Featured</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl xl:text-5xl">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
            {/* Meta */}
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

            {/* Countdown */}
            {new Date(event.startDate) > new Date() && (
              <div className="rounded-2xl bg-muted p-6">
                <h3 className="font-semibold mb-3">Event Starts In</h3>
                <CountdownTimer targetDate={event.startDate} />
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold mb-3">About This Event</h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line">
                {description}
              </div>
            </section>

            {/* Schedule */}
            {(scheduleItems.length > 0 || agenda.length > 0) && (
              <PublicEventScheduleSection
                scheduleItems={scheduleItems}
                agenda={agenda}
              />
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Mic className="h-5 w-5 text-primary" />Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="flex gap-4 rounded-xl border p-4 border-border">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 bg-muted">
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

            {/* Sponsors */}
            {event.sponsors.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Sponsors</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {event.sponsors.map((es) => (
                    <div key={es.id} className="text-center rounded-xl border p-4 border-border">
                      <Badge variant="accent" className="mb-2">{es.level}</Badge>
                      <p className="font-medium">{es.sponsor.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Exhibitors */}
            {event.exhibitors.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Exhibitors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.exhibitors.map((ee) => (
                    <Link key={ee.id} href={`/exhibitors/${ee.exhibitor.slug}`} className="rounded-xl border border-border p-4 hover:border-champagne transition-colors">
                      <p className="font-medium">{ee.exhibitor.companyName}</p>
                      {ee.boothNumber && <p className="text-sm text-muted-foreground">Booth {ee.boothNumber}</p>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden">
                      <SafeImage src={img.url} alt={img.caption || ""} fill />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {faqs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />FAQs</h2>
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="rounded-xl border p-4 border-border">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {event.reviews.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {event.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border p-4 border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="font-medium text-sm">{review.user.name}</span>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Organizer */}
            <section className="rounded-2xl border p-6 border-border">
              <h2 className="text-lg font-bold mb-3">Organized By</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-muted">
                  <SafeImage src={event.organizer.image} alt={event.organizer.name || ""} fill />
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    {event.organizer.name}
                    {event.organizer.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </p>
                  {event.organizer.company && <p className="text-sm text-muted-foreground">{event.organizer.company}</p>}
                  <p className="text-sm text-muted-foreground/70">{event.organizer._count.organizedEvents} events</p>
                </div>
              </div>
            </section>
          </div>

          {/* Registration sidebar */}
          <div className="order-1 space-y-4 lg:order-2">
            {visitorTicket && (
              <Card className="lg:sticky lg:top-24 border-champagne/30 bg-gradient-to-br from-card to-muted/30">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Register to visit</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get your free personalised badge with name, designation, and QR code for expo check-in.
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/events/${event.slug}/register`}>Get my visitor badge</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Events */}
        {similar.length > 0 && (
          <section className="mt-16 border-t pt-12 border-border">
            <h2 className="text-2xl font-bold mb-6">Similar Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similar.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
