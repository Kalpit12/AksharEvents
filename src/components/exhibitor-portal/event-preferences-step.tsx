"use client";

import { CustomSelect, toSelectOptions } from "@/components/exhibitor-portal/custom-select";
import type { EventItemMasterOption } from "@/lib/event-config-types";
import { getBoothCatalogItems } from "@/lib/item-master-catalog";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type FormSlice = {
  setup: string;
  access: string;
};

type Props = {
  catalog: EventItemMasterOption[];
  setupOptions: string[];
  selectedBoothItemId: string | null;
  form: FormSlice;
  onBoothChange: (itemId: string) => void;
  onFormChange: (patch: Partial<FormSlice>) => void;
};

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={toSelectOptions(options, placeholder)}
      placeholder={placeholder}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function boothShortName(name: string) {
  if (name.startsWith("Booth Deco")) return "Booth Deco All Sizes";
  const base = name.split(" Table ")[0] ?? name;
  const tier = name.match(/\)\s*(Silver|Gold|Platinum)\s*$/i)?.[1];
  if (tier && !base.includes(tier)) return `${base} ${tier}`;
  return base;
}

function boothSelectOptions(items: EventItemMasterOption[]) {
  return items.map((item) => {
    const price = formatCurrency(item.unitCost, item.currency);
    const short = boothShortName(item.name);
    return {
      value: item.id,
      label: `${item.name} — ${price}`,
      triggerLabel: `${short} — ${price}`,
    };
  });
}

export function EventPreferencesStep({
  catalog,
  setupOptions,
  selectedBoothItemId,
  form,
  onBoothChange,
  onFormChange,
}: Props) {
  const boothItems = getBoothCatalogItems(catalog);

  return (
    <>
      {boothItems.length === 0 ? (
        <p className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
          Booth packages have not been published yet. The event organiser will add them under the
          Booth category in Event Master → Item master.
        </p>
      ) : (
        <Field label="Booth preference">
          <CustomSelect
            value={selectedBoothItemId ?? ""}
            onChange={onBoothChange}
            placeholder="Select booth package…"
            options={boothSelectOptions(boothItems)}
          />
        </Field>
      )}

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <Field label="Booth setup date">
          <Select
            value={form.setup}
            onChange={(v) => onFormChange({ setup: v })}
            options={setupOptions}
            placeholder="Select…"
          />
        </Field>
      </div>

      <Field label="Special accessibility or setup requirements">
        <Textarea
          value={form.access}
          onChange={(e) => onFormChange({ access: e.target.value })}
          placeholder="e.g. wheelchair access, extra tables, signage needs…"
          rows={2}
        />
      </Field>
    </>
  );
}
