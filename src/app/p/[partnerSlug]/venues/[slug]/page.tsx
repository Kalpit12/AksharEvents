import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockVenues } from "@/lib/mock-data";
import { SafeImage } from "@/components/ui/SafeImage";
import { requirePartner } from "@/components/partner/partner-marketing-pages";
import { partnerPath } from "@/lib/partners";

export default async function PartnerVenueDetailPage({
  params,
}: {
  params: Promise<{ partnerSlug: string; slug: string }>;
}) {
  const { partnerSlug, slug } = await params;
  const partner = await requirePartner(partnerSlug);
  const base = partnerPath(partner.slug);

  const venue = isFrontendOnly()
    ? getMockVenues().find((v) => v.slug === slug)
    : await prisma.venue.findUnique({ where: { slug } });

  if (!venue) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl">
        <SafeImage src={venue.images[0]} alt={venue.name} fill />
      </div>
      <h1 className="text-3xl font-bold">{venue.name}</h1>
      <p className="mt-2 text-muted-foreground">{venue.address}, {venue.city}</p>
      {venue.description && (
        <p className="mt-6 whitespace-pre-line text-muted-foreground">{venue.description}</p>
      )}
      <Link href={`${base}/events`} className="mt-8 inline-block text-primary">
        View events at this venue →
      </Link>
    </div>
  );
}
