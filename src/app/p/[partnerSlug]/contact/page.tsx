import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Contact");
}

export default async function PartnerContactPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Contact {partner.name}</h1>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        {partner.contactEmail && (
          <p className="text-muted-foreground">
            Email:{" "}
            <a href={`mailto:${partner.contactEmail}`} className="text-primary">
              {partner.contactEmail}
            </a>
          </p>
        )}
        {partner.contactPhone && (
          <p className="mt-2 text-muted-foreground">Phone: {partner.contactPhone}</p>
        )}
        {!partner.contactEmail && !partner.contactPhone && (
          <p className="text-muted-foreground">
            Contact details will be published soon. Bookings are processed via AxarEvents.
          </p>
        )}
      </div>
    </div>
  );
}
