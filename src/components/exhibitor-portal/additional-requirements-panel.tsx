"use client";

import { RegistrationInvoicePanel } from "@/components/exhibitor-portal/registration-invoice-panel";
import type { EventItemMasterOption } from "@/lib/event-config-types";
import {
  categorySelectPrompt,
  getAdditionalRequirementItems,
  groupItemsByCategory,
} from "@/lib/item-master-catalog";
import { cn, formatCurrency } from "@/lib/utils";
import { Check, PackagePlus } from "lucide-react";
import { Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";

type Props = {
  catalog: EventItemMasterOption[];
  selectedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  companyName: string;
  eventTitle: string;
  contactName?: string;
  onInvoiceDownload?: () => void | Promise<void>;
};

export function AdditionalRequirementsPanel({
  catalog,
  selectedItemIds,
  onToggleItem,
  companyName,
  eventTitle,
  contactName,
  onInvoiceDownload,
}: Props) {
  const additionalItems = getAdditionalRequirementItems(catalog);
  const groups = groupItemsByCategory(additionalItems);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,24rem)]">
      <Panel title="Additional requirements" icon={PackagePlus}>
        {groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No additional items have been published yet. The event organiser can add categories and
            items in Event Master → Item master (Equipment, Consumables, Services, and more).
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map(({ category, items, guidance }) => (
              <section key={category} className="rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">{category}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categorySelectPrompt(category) || guidance}
                </p>
                <div className="mt-3 space-y-2">
                  {items.map((item) => {
                    const selected = selectedItemIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onToggleItem(item.id)}
                        className={cn(
                          "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                          selected
                            ? "border-primary bg-champagne/10 shadow-sm"
                            : "border-border bg-background hover:border-champagne/30 hover:bg-muted/40"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {item.unitOfMeasure} · {formatCurrency(item.unitCost, item.currency)}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Panel>

      <RegistrationInvoicePanel
        className="xl:sticky xl:top-4 xl:self-start"
        catalog={catalog}
        selectedItemIds={[...selectedItemIds]}
        companyName={companyName}
        eventTitle={eventTitle}
        contactName={contactName}
        title="Additional requirements invoice"
        onAfterDownload={onInvoiceDownload}
      />
    </div>
  );
}
