import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Privacy");
}

export default async function PartnerPrivacyPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 prose dark:prose-invert">
      <h1>Privacy Policy — {partner.name}</h1>
      <p>
        Registration data collected on {partner.name} is stored and processed by AxarEvents
        in accordance with applicable privacy laws. Payment details are handled by HDFC
        SmartGateway and are not stored on our servers.
      </p>
    </div>
  );
}
