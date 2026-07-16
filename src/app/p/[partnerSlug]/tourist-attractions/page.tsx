import { KenyaAttractionsContent } from "@/components/exhibitor-portal/kenya-attractions-content";
import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Tourist Attractions");
}

export default async function PartnerTouristAttractionsPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  await requirePartner((await params).partnerSlug);
  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 lg:px-8">
      <KenyaAttractionsContent />
    </div>
  );
}
