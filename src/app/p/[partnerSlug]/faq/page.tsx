import { faqSections } from "@/lib/faq-content";
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
      <h1 className="text-3xl font-bold">FAQ — {partner.name}</h1>
      <div className="mt-8 space-y-8">
        {faqSections.map((section) => (
          <section key={section.id}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.faqs.map((item) => (
                <div key={item.q} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{item.q}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
