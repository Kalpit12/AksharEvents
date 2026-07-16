"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAdminPartner, updateAdminPartner, assignEventPartner } from "@/lib/admin-partners";
import { partnerPath } from "@/lib/partners";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";

type PartnerRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  primaryColor: string;
  isActive: boolean;
  _count: { events: number };
};

type EventRow = { id: string; title: string; partnerId: string | null };

export default function AdminPartnersPanel({
  partners,
  events,
}: {
  partners: PartnerRow[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await createAdminPartner(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Partner created at /p/${result.slug}`);
    e.currentTarget.reset();
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
          <div>
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#0D9488" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" className="mt-1.5" />
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
          <div key={partner.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">
                  /p/{partner.slug} · {partner._count.events} partner event(s)
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={partnerPath(partner.slug)} target="_blank">View site</Link>
              </Button>
            </div>

            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await updateAdminPartner(partner.id, new FormData(e.currentTarget));
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Partner updated");
                  router.refresh();
                }
              }}
            >
              <Input name="name" defaultValue={partner.name} />
              <Input name="tagline" defaultValue={partner.tagline ?? ""} placeholder="Tagline" />
              <Input name="primaryColor" type="color" defaultValue={partner.primaryColor} />
              <select name="isActive" defaultValue={partner.isActive ? "true" : "false"} className="h-10 rounded-lg border px-3 text-sm">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <Button type="submit" size="sm" className="sm:col-span-2">Save partner</Button>
            </form>
          </div>
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
