import { notFound } from "next/navigation";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";
import { PublicEventDetail } from "@/components/events/public-event-detail";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { partnerSlug, slug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  const event = partner ? await getEventBySlug(slug, partner.id) : null;
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.shortDescription || event.description.slice(0, 160),
  };
}

export default async function PartnerEventDetailPage({
  params,
}: {
  params: Promise<{ partnerSlug: string; slug: string }>;
}) {
  const { partnerSlug, slug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const base = partnerPath(partner.slug);

  return (
    <PublicEventDetail
      slug={slug}
      partnerId={partner.id}
      eventsBasePath={`${base}/events`}
    />
  );
}
