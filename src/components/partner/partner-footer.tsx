import Link from "next/link";
import type { PartnerPublic } from "@/lib/partners";
import { partnerPath } from "@/lib/partners";

export function PartnerFooter({ partner }: { partner: PartnerPublic }) {
  const base = partnerPath(partner.slug);

  return (
    <footer className="mt-auto border-t border-[color-mix(in_oklab,var(--partner-primary)_30%,transparent)] bg-[var(--partner-secondary)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold">{partner.name}</p>
            {partner.tagline && (
              <p className="mt-1 text-sm text-white/75">{partner.tagline}</p>
            )}
            <p className="mt-3 text-xs text-white/60">
              Events powered by AxarEvents
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--partner-primary)]">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li><Link href={`${base}/events`}>Events</Link></li>
              <li><Link href={`${base}/venues`}>Venues</Link></li>
              <li><Link href={`${base}/categories`}>Categories</Link></li>
              <li><Link href={`${base}/tourist-attractions`}>Tourist attractions</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--partner-primary)]">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li><Link href={`${base}/about`}>About</Link></li>
              <li><Link href={`${base}/faq`}>FAQ</Link></li>
              <li><Link href={`${base}/contact`}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--partner-primary)]">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li><Link href={`${base}/terms`}>Terms</Link></li>
              <li><Link href={`${base}/privacy`}>Privacy</Link></li>
            </ul>
            {(partner.contactEmail || partner.contactPhone) && (
              <div className="mt-4 text-sm text-white/75">
                {partner.contactEmail && <p>{partner.contactEmail}</p>}
                {partner.contactPhone && <p>{partner.contactPhone}</p>}
              </div>
            )}
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-white/55">
          © {new Date().getFullYear()} {partner.name}. Booked via AxarEvents.
        </p>
      </div>
    </footer>
  );
}
