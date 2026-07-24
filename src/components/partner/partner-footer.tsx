import Link from "next/link";
import type { PartnerPublic } from "@/lib/partners";
import { partnerPath } from "@/lib/partners";
import { PartnerContactDetails } from "@/components/partner/partner-contact-details";

export function PartnerFooter({ partner }: { partner: PartnerPublic }) {
  const base = partnerPath(partner.slug);

  return (
    <footer className="mt-auto border-t border-[color-mix(in_oklab,var(--partner-primary)_30%,transparent)] bg-[var(--partner-secondary)] text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6 lg:px-8">
        <Link href={base} className="font-semibold hover:text-[var(--partner-primary)]">
          {partner.name}
        </Link>
        <PartnerContactDetails partner={partner} variant="footer" />
        <p className="text-xs text-white/55">
          © {new Date().getFullYear()} {partner.name}. Events powered by AxarEvents.
        </p>
      </div>
    </footer>
  );
}
