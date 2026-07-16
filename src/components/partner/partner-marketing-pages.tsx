import { notFound } from "next/navigation";
import { getPartnerBySlug } from "@/lib/partners";
import type { Metadata } from "next";

export async function partnerPageMetadata(
  partnerSlug: string,
  title: string
): Promise<Metadata> {
  const partner = await getPartnerBySlug(partnerSlug);
  return { title: partner ? `${title} — ${partner.name}` : title };
}

export function PartnerAboutPageContent({
  partner,
}: {
  partner: NonNullable<Awaited<ReturnType<typeof getPartnerBySlug>>>;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">About {partner.name}</h1>
      {partner.tagline && (
        <p className="mt-2 text-lg text-muted-foreground">{partner.tagline}</p>
      )}
      <div className="prose dark:prose-invert mt-8 max-w-none text-muted-foreground">
        {partner.aboutHtml ? (
          <div dangerouslySetInnerHTML={{ __html: partner.aboutHtml }} />
        ) : (
          <p>
            {partner.name} hosts events through AxarEvents — discover conferences, expos,
            and career fairs with seamless registration and secure HDFC payments.
          </p>
        )}
      </div>
    </div>
  );
}

export async function requirePartner(partnerSlug: string) {
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();
  return partner;
}
