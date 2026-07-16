import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Terms");
}

export default async function PartnerTermsPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 prose dark:prose-invert">
      <h1>Terms of Service — {partner.name}</h1>
      <p>
        Bookings made through {partner.name} are processed by AxarEvents. Paid registrations
        use HDFC SmartGateway for secure payment processing.
      </p>
    </div>
  );
}
