import { redirect } from "next/navigation";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";

export default async function PartnerEventsRedirectPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) redirect("/");

  redirect(partnerPath(partner.slug));
}
