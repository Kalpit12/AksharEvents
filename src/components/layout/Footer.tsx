import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/utils";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com/aksharevents",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/aksharevents",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/aksharevents",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/aksharevents",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
] as const;

const footerLinks = {
  Platform: [
    { href: "/events", label: "Browse Events" },
    { href: "/categories", label: "Categories" },
    { href: "/venues", label: "Venues" },
    { href: "/auth/exhibitor", label: "Exhibitor Portal" },
    { href: "/auth/login", label: "Event Master" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms and Conditions" },
  ],
} as const;

function FooterLinkList({
  links,
  mobile = false,
}: {
  links: readonly { href: string; label: string }[];
  mobile?: boolean;
}) {
  return (
    <ul className={mobile ? "space-y-0.5 pb-1" : "mt-3 space-y-2"}>
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={
              mobile
                ? "flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors active:bg-card hover:text-primary"
                : "text-sm text-muted-foreground transition-colors hover:text-primary"
            }
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-border last:border-b-0" {...(defaultOpen ? { open: true } : {})}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="overflow-visible pb-4 pl-1">{children}</div>
    </details>
  );
}

function BrandBlock({ centered = false }: { centered?: boolean }) {
  return (
    <div className={centered ? "text-center" : undefined}>
      <Link
        href="/"
        className={`inline-flex items-center gap-2.5 ${centered ? "justify-center" : ""}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          A
        </div>
        <span className="text-lg font-bold text-foreground">{BRAND.name}</span>
      </Link>
      <p className="mt-3 text-sm font-medium text-primary">{BRAND.tagline}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Kenya&apos;s premier event discovery and booking platform for career fairs, conferences, and expos across Africa.
      </p>
      <div className={`mt-5 flex gap-2.5 ${centered ? "justify-center" : ""}`}>
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary active:scale-95"
          >
            {social.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

function ContactIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
      {children}
    </span>
  );
}

function ContactBlock({ mobile = false }: { mobile?: boolean }) {
  const nowrapText = "whitespace-nowrap text-sm";

  if (mobile) {
    return (
      <div className="space-y-2 pb-2">
        <a
          href="mailto:info@aksharevents.com"
          className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 text-foreground transition-colors active:bg-muted"
        >
          <ContactIcon>
            <Mail className="h-4 w-4" />
          </ContactIcon>
          <span className={nowrapText}>info@aksharevents.com</span>
        </a>
        <a
          href="tel:+254786658200"
          className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 text-foreground transition-colors active:bg-muted"
        >
          <ContactIcon>
            <Phone className="h-4 w-4" />
          </ContactIcon>
          <span className={nowrapText}>+254 786 658 200</span>
        </a>
        <div className="flex gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
          <ContactIcon>
            <MapPin className="h-4 w-4" />
          </ContactIcon>
          <p className="min-w-0 leading-relaxed">
            <span className={nowrapText}>Suite 14th – 5th floor, Parksuite Towers</span>
            <br />
            <span className={nowrapText}>Parklands Road, Nairobi, Kenya</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
      <a
        href="mailto:info@aksharevents.com"
        className="flex items-center gap-2.5 transition-colors hover:text-primary"
      >
        <ContactIcon>
          <Mail className="h-4 w-4" />
        </ContactIcon>
        <span className={nowrapText}>info@aksharevents.com</span>
      </a>
      <a
        href="tel:+254786658200"
        className="flex items-center gap-2.5 transition-colors hover:text-primary"
      >
        <ContactIcon>
          <Phone className="h-4 w-4" />
        </ContactIcon>
        <span className={nowrapText}>+254 786 658 200</span>
      </a>
      <div className="flex items-start gap-2.5">
        <ContactIcon>
          <MapPin className="h-4 w-4" />
        </ContactIcon>
        <p className="min-w-0 leading-relaxed">
          <span className={nowrapText}>Suite 14th – 5th floor, Parksuite Towers</span>
          <br />
          <span className={nowrapText}>Parklands Road, Nairobi, Kenya</span>
        </p>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative z-10 shrink-0 border-t border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:px-8">
        {/* Mobile layout */}
        <div className="md:hidden">
          <BrandBlock centered />

          <div className="mt-8 rounded-2xl border border-border bg-card/50 px-1">
            {Object.entries(footerLinks).map(([title, links]) => (
              <FooterAccordion key={title} title={title}>
                <FooterLinkList links={links} mobile />
              </FooterAccordion>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <div className="mt-3">
              <ContactBlock mobile />
            </div>
          </div>
        </div>

        {/* Desktop & tablet layout */}
        <div className="hidden items-start md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-10 lg:grid-cols-12 lg:gap-x-6 xl:gap-x-10">
          <div className="md:col-span-2 lg:col-span-3">
            <BrandBlock />
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <FooterLinkList links={links} />
            </div>
          ))}

          <div className="min-w-[17rem] lg:col-span-3">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ContactBlock />
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 max-md:pb-6 sm:mt-10">
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            © {new Date().getFullYear()} Maxpro Infotech Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
