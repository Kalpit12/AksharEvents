"use client";

import { Button } from "@/components/ui/Button";
import { buildRegistrationInvoiceFromIds } from "@/lib/registration-invoice";
import { downloadRegistrationInvoicePdf } from "@/lib/registration-invoice-pdf";
import type { EventItemMasterOption } from "@/lib/event-config-types";
import { BRAND, cn, formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

type Props = {
  catalog: EventItemMasterOption[];
  selectedItemIds: string[];
  companyName: string;
  eventTitle: string;
  contactName?: string;
  title?: string;
  className?: string;
  onAfterDownload?: () => void | Promise<void>;
};

export function RegistrationInvoicePanel({
  catalog,
  selectedItemIds,
  companyName,
  eventTitle,
  contactName,
  title = "Invoice",
  className,
  onAfterDownload,
}: Props) {
  const invoice = buildRegistrationInvoiceFromIds(catalog, selectedItemIds);
  const vatPercent = Math.round(invoice.vatRate * 100);

  return (
    <aside
      className={cn(
        "min-w-[min(100%,22rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:min-w-[24rem]",
        className
      )}
    >
      <div className="bg-gradient-to-br from-espresso via-espresso to-champagne-dark px-4 py-3.5 text-alabaster">
        <div className="text-base font-bold tracking-tight">{BRAND.name}</div>
        <div className="text-[11px] text-champagne-light/85">{BRAND.tagline}</div>
        <div className="mt-2 text-sm font-semibold text-alabaster/95">{title}</div>
      </div>

      <div className="p-4">
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          All catalogue prices and totals are <strong className="font-medium text-foreground">excluding VAT</strong>.
          VAT at {vatPercent}% is shown for reference.
        </p>

        {invoice.lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select items to see your invoice.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[18rem] table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-[7.25rem]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-medium text-muted-foreground">
                    <th className="px-3 py-2">Item</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Amount (ex VAT)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line) => (
                    <tr key={line.itemId} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 align-top">
                        <div className="font-medium leading-snug text-foreground">{line.name}</div>
                        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {line.category} · {line.quantity} {line.unitOfMeasure} ×{" "}
                          {formatCurrency(line.unitCost, line.currency)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right align-top font-medium tabular-nums">
                        {formatCurrency(line.lineTotal, line.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 text-muted-foreground">
                <dt>VAT ({vatPercent}%)</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {formatCurrency(invoice.vatAmount, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2.5 text-base font-semibold">
                <dt>Total (ex VAT)</dt>
                <dd className="whitespace-nowrap tabular-nums text-primary">
                  {formatCurrency(invoice.subtotalExVat, invoice.currency)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <Button
          type="button"
          size="sm"
          className="mt-4 w-full gap-1.5 bg-espresso text-alabaster hover:bg-espresso/90"
          disabled={invoice.lines.length === 0}
          onClick={() => {
            downloadRegistrationInvoicePdf(invoice, {
              companyName,
              eventTitle,
              contactName,
              invoiceTitle: title,
            });
            void onAfterDownload?.();
          }}
        >
          <Download className="h-4 w-4" />
          Download invoice
        </Button>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          {BRAND.name} · {eventTitle}
        </p>
      </div>
    </aside>
  );
}
