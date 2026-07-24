import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactFields = {
  contactEmail: string | null;
  contactPhone: string | null;
};

export function PartnerContactDetails({
  partner,
  variant = "card",
  className,
}: {
  partner: ContactFields;
  variant?: "card" | "inline" | "footer";
  className?: string;
}) {
  const email = partner.contactEmail?.trim() || null;
  const phone = partner.contactPhone?.trim() || null;

  if (!email && !phone) return null;

  if (variant === "footer") {
    return (
      <div className={cn("flex flex-col items-center gap-1 text-sm text-white/75", className)}>
        {email && (
          <a href={`mailto:${email}`} className="hover:text-[var(--partner-primary)]">
            {email}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="hover:text-[var(--partner-primary)]"
          >
            {phone}
          </a>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "hidden items-center gap-4 text-sm text-muted-foreground lg:flex",
          className
        )}
      >
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 hover:text-[var(--partner-primary)]"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="max-w-[180px] truncate">{email}</span>
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 hover:text-[var(--partner-primary)]"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {phone}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-[var(--partner-primary)]/40"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--partner-primary)_12%,transparent)] text-[var(--partner-primary)]">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Email</p>
            <p className="mt-0.5 break-all text-sm text-muted-foreground">{email}</p>
          </div>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-[var(--partner-primary)]/40"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--partner-primary)_12%,transparent)] text-[var(--partner-primary)]">
            <Phone className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Contact number</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{phone}</p>
          </div>
        </a>
      )}
    </div>
  );
}
