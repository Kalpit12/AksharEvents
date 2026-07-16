import { notFound } from "next/navigation";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";
import { PartnerThemeWrapper } from "@/components/partner/partner-theme-wrapper";
import { PartnerHeader } from "@/components/partner/partner-header";
import { PartnerFooter } from "@/components/partner/partner-footer";
import { PartnerBasePathProvider } from "@/contexts/partner-base-path";

export default async function PartnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const basePath = partnerPath(partner.slug);

  return (
    <PartnerBasePathProvider basePath={basePath}>
      <PartnerThemeWrapper partner={partner}>
        <div className="flex min-h-dvh flex-col">
          <PartnerHeader partner={partner} />
          <main className="min-h-0 flex-1">{children}</main>
          <PartnerFooter partner={partner} />
        </div>
      </PartnerThemeWrapper>
    </PartnerBasePathProvider>
  );
}
