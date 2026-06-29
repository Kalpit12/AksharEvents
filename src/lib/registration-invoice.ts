import type { EventItemMasterOption } from "@/lib/event-config-types";
import { DEFAULT_VAT_RATE } from "@/lib/item-master-catalog";

export type RegistrationInvoiceLine = {
  itemId: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  quantity: number;
  unitCost: number;
  currency: string;
  lineTotal: number;
};

export type RegistrationInvoice = {
  lines: RegistrationInvoiceLine[];
  currency: string;
  subtotalExVat: number;
  vatRate: number;
  vatAmount: number;
  totalIncVat: number;
};

export function buildRegistrationInvoiceFromIds(
  catalog: EventItemMasterOption[],
  itemIds: string[],
  vatRate = DEFAULT_VAT_RATE
): RegistrationInvoice {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const lines: RegistrationInvoiceLine[] = [];

  for (const itemId of itemIds) {
    const item = byId.get(itemId);
    if (!item) continue;
    lines.push({
      itemId: item.id,
      name: item.name,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      quantity: 1,
      unitCost: item.unitCost,
      currency: item.currency,
      lineTotal: item.unitCost,
    });
  }

  const currency = lines[0]?.currency ?? "KES";
  const subtotalExVat = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const vatAmount = Math.round(subtotalExVat * vatRate * 100) / 100;
  const totalIncVat = Math.round((subtotalExVat + vatAmount) * 100) / 100;

  return {
    lines,
    currency,
    subtotalExVat,
    vatRate,
    vatAmount,
    totalIncVat,
  };
}

/** Booth (registration) + additional requirement selections */
export function buildFullExhibitorInvoice(
  catalog: EventItemMasterOption[],
  selectedBoothItemId: string | null,
  selectedAdditionalItemIds: string[],
  vatRate = DEFAULT_VAT_RATE
) {
  const ids = [
    ...(selectedBoothItemId ? [selectedBoothItemId] : []),
    ...selectedAdditionalItemIds,
  ];
  return buildRegistrationInvoiceFromIds(catalog, ids, vatRate);
}
