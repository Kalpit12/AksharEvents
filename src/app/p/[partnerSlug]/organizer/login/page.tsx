import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPartnerBySlug, partnerPath } from "@/lib/partners";
import { PartnerOrganizerLoginForm } from "@/components/partner/partner-organizer-login-form";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export default async function PartnerOrganizerLoginPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await getPartnerBySlug(partnerSlug);
  if (!partner) notFound();

  const user = await getCurrentUser();
  if (user) {
    const isAdmin = user.role === "ADMIN";
    const isPartnerContact =
      normalizeEmail(partner.contactEmail) !== "" &&
      normalizeEmail(partner.contactEmail) === normalizeEmail(user.email);

    if (isAdmin || isPartnerContact) {
      redirect(partnerPath(partnerSlug, "/organizer"));
    }
  }

  return <PartnerOrganizerLoginForm partnerSlug={partnerSlug} partnerName={partner.name} />;
}
