import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isFrontendOnly } from "@/lib/frontend-only";
import { getMockVenues } from "@/lib/mock-data";
import { SafeImage } from "@/components/ui/SafeImage";
import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";
import { partnerPath } from "@/lib/partners";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Venues");
}

export default async function PartnerVenuesPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);
  const base = partnerPath(partner.slug);

  const venues = isFrontendOnly()
    ? getMockVenues()
    : await prisma.venue.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Event Venues</h1>
      <p className="mt-2 text-muted-foreground">Venues featured on {partner.name}</p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            href={`${base}/venues/${venue.slug}`}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[16/10]">
              <SafeImage src={venue.images[0]} alt={venue.name} fill />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{venue.name}</h3>
              <p className="text-sm text-muted-foreground">{venue.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
