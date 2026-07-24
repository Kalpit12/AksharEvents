import { PartnerContactDetails } from "@/components/partner/partner-contact-details";
import { PartnerEnquiryForm } from "@/components/partner/partner-enquiry-form";
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
  const hasDirectContact = Boolean(
    partner.contactEmail?.trim() || partner.contactPhone?.trim()
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Contact {partner.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Reach us directly or send an enquiry and we&apos;ll get back to you as soon as
          possible.
        </p>
      </div>

      {hasDirectContact && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contact details
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {partner.contactEmail?.trim() && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <a
                  href={`mailto:${partner.contactEmail.trim()}`}
                  className="mt-1 block break-all text-base font-medium text-[var(--partner-primary)] hover:underline"
                >
                  {partner.contactEmail.trim()}
                </a>
              </div>
            )}
            {partner.contactPhone?.trim() && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Contact number</p>
                <a
                  href={`tel:${partner.contactPhone.trim().replace(/\s+/g, "")}`}
                  className="mt-1 block text-base font-medium text-[var(--partner-primary)] hover:underline"
                >
                  {partner.contactPhone.trim()}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
        <div className="lg:col-span-2">
          {hasDirectContact ? (
            <PartnerContactDetails partner={partner} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Prefer email? Use the form and we&apos;ll route your message through
                AxarEvents.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:col-span-3">
          <h2 className="text-xl font-semibold">Send an enquiry</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the form below and the team will respond shortly.
          </p>
          {hasDirectContact && (
            <p className="mt-3 text-sm text-muted-foreground">
              Or contact us at{" "}
              {partner.contactEmail?.trim() && (
                <a
                  href={`mailto:${partner.contactEmail.trim()}`}
                  className="font-medium text-[var(--partner-primary)] hover:underline"
                >
                  {partner.contactEmail.trim()}
                </a>
              )}
              {partner.contactEmail?.trim() && partner.contactPhone?.trim() && " / "}
              {partner.contactPhone?.trim() && (
                <a
                  href={`tel:${partner.contactPhone.trim().replace(/\s+/g, "")}`}
                  className="font-medium text-[var(--partner-primary)] hover:underline"
                >
                  {partner.contactPhone.trim()}
                </a>
              )}
              .
            </p>
          )}
          <div className="mt-6">
            <PartnerEnquiryForm
              partnerSlug={partner.slug}
              partnerName={partner.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
