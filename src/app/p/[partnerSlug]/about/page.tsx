import { PartnerAboutPageContent, partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "About");
}

export default async function PartnerAboutPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);
  return <PartnerAboutPageContent partner={partner} />;
}
