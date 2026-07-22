import { FaqPageContent } from "@/components/faq/faq-page-content";
import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "FAQ");
}

export default async function PartnerFaqPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <FaqPageContent
        title={`FAQ — ${partner.name}`}
        subtitle={`Answers about ${partner.name} events on AxarEvents — visitor badges, exhibitor portal, payments, and support.`}
      />
    </div>
  );
}
