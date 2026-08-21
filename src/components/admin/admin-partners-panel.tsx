"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { createAdminPartner, updateAdminPartner, assignEventPartner } from "@/lib/admin-partners";
import { partnerPath } from "@/lib/partners";
import { DEFAULT_PALETTE, normalizeHexColor, type LogoPalette } from "@/lib/logo-palette";
import { PartnerLogoField } from "@/components/admin/partner-logo-field";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PartnerRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  foregroundColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  _count: { events: number };
};

type EventRow = { id: string; title: string; partnerId: string | null };

function paletteFromPartner(partner: PartnerRow): LogoPalette {
  return {
    primary: normalizeHexColor(partner.primaryColor, DEFAULT_PALETTE.primary),
    secondary: normalizeHexColor(partner.secondaryColor ?? "", DEFAULT_PALETTE.secondary),
    accent: normalizeHexColor(partner.accentColor ?? "", DEFAULT_PALETTE.accent),
    background: normalizeHexColor(partner.backgroundColor ?? "", DEFAULT_PALETTE.background),
    foreground: normalizeHexColor(partner.foregroundColor ?? "", DEFAULT_PALETTE.foreground),
  };
}

export default function AdminPartnersPanel({
  partners,
  events,
}: {
  partners: PartnerRow[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [createColors, setCreateColors] = useState<LogoPalette>(DEFAULT_PALETTE);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    const result = await createAdminPartner(new FormData(form));
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Partner created at /p/${result.slug}`);
    form.reset();
    setCreateColors(DEFAULT_PALETTE);
    setCreateKey((key) => key + 1);
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Create partner site</h2>
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input id="slug" name="slug" className="mt-1.5" placeholder="acme-events" />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" className="mt-1.5" />
          </div>
          <PartnerLogoField
            key={createKey}
            idPrefix="create"
            colors={createColors}
            onColorsChange={setCreateColors}
          />
          <div>
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact number</Label>
            <Input id="contactPhone" name="contactPhone" type="tel" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="aboutHtml">About (HTML)</Label>
            <Textarea id="aboutHtml" name="aboutHtml" rows={4} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create partner"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        {partners.map((partner) => (
          <PartnerEditCard key={partner.id} partner={partner} />
        ))}

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Assign events to partners</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform events (no partner) appear on all partner sites. Partner-owned events appear only on that partner site.
          </p>
          <div className="mt-4 space-y-2">
            {events.slice(0, 20).map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{event.title}</span>
                <select
                  className="h-9 rounded-lg border px-2"
                  defaultValue={event.partnerId ?? ""}
                  onChange={async (e) => {
                    const result = await assignEventPartner(
                      event.id,
                      e.target.value || null
                    );
                    if (result.error) toast.error(result.error);
                    else toast.success("Event assignment updated");
                  }}
                >
                  <option value="">Platform (Axar)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PartnerEditCard({ partner }: { partner: PartnerRow }) {
  const router = useRouter();
  const [colors, setColors] = useState<LogoPalette>(() => paletteFromPartner(partner));
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const detailsId = `partner-details-${partner.id}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left hover:opacity-90"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
        >
          {partner.logoUrl ? (
            <span
              className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white"
              style={{ backgroundColor: colors.background }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            </span>
          ) : (
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {partner.name.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{partner.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  partner.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                )}
              >
                {partner.isActive ? "Active" : "Inactive"}
              </span>
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              /p/{partner.slug} · {partner._count.events} partner event(s)
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={partnerPath(partner.slug)} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              View site
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? `Minimize ${partner.name}` : `Expand ${partner.name}`}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {expanded ? (
        <form
          id={detailsId}
          className="mt-4 space-y-4 border-t border-border pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const result = await updateAdminPartner(partner.id, new FormData(e.currentTarget));
            setSaving(false);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Partner updated");
              router.refresh();
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" defaultValue={partner.name} />
            <Input name="tagline" defaultValue={partner.tagline ?? ""} placeholder="Tagline" />
            <Input
              name="contactEmail"
              type="email"
              defaultValue={partner.contactEmail ?? ""}
              placeholder="Contact email"
            />
            <Input
              name="contactPhone"
              type="tel"
              defaultValue={partner.contactPhone ?? ""}
              placeholder="Contact number"
            />
          </div>
          <PartnerLogoField
            idPrefix={`partner-${partner.id}`}
            currentLogoUrl={partner.logoUrl}
            colors={colors}
            onColorsChange={setColors}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select name="isActive" defaultValue={partner.isActive ? "true" : "false"} className="h-10 rounded-lg border px-3 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save partner"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
