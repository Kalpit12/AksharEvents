import { jsPDF } from "jspdf";
import type { RegistrationInvoice } from "@/lib/registration-invoice";
import { BRAND, formatCurrency } from "@/lib/utils";

type InvoicePdfMeta = {
  companyName: string;
  eventTitle: string;
  contactName?: string;
  invoiceTitle?: string;
  generatedAt?: Date;
};

const BRAND_HEADER_RGB = { r: 28, g: 26, b: 23 };
const BRAND_ACCENT_RGB = { r: 197, g: 168, b: 128 };

export function downloadRegistrationInvoicePdf(invoice: RegistrationInvoice, meta: InvoicePdfMeta) {
  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const amountColRight = pageWidth - margin;
  const qtyColRight = margin + 102;
  const unitColLeft = margin + 108;
  let y = 34;
  const vatPercent = Math.round(invoice.vatRate * 100);
  const title = meta.invoiceTitle ?? "Invoice";

  doc.setFillColor(BRAND_HEADER_RGB.r, BRAND_HEADER_RGB.g, BRAND_HEADER_RGB.b);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND.name, margin, 11);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_ACCENT_RGB.r, BRAND_ACCENT_RGB.g, BRAND_ACCENT_RGB.b);
  doc.text(BRAND.tagline, margin, 16);

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin, 23);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(meta.eventTitle, margin, y);
  y += 5;
  doc.text(meta.companyName, margin, y);
  y += 5;
  if (meta.contactName) {
    doc.text(meta.contactName, margin, y);
    y += 5;
  }
  doc.setTextColor(100);
  doc.text(`Generated ${(meta.generatedAt ?? new Date()).toLocaleString("en-KE")}`, margin, y);
  y += 10;

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("All amounts are excluding VAT.", margin, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item", margin, y);
  doc.text("Qty", qtyColRight, y, { align: "right" });
  doc.text("Unit", unitColLeft, y);
  doc.text("Amount (ex VAT)", amountColRight, y, { align: "right" });
  y += 4;
  doc.setDrawColor(BRAND_ACCENT_RGB.r, BRAND_ACCENT_RGB.g, BRAND_ACCENT_RGB.b);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  if (invoice.lines.length === 0) {
    doc.text("No items selected.", margin, y);
  } else {
    for (const line of invoice.lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const label = `${line.name} (${line.category})`;
      const wrapped = doc.splitTextToSize(label, 88);
      const rowHeight = Math.max(6, wrapped.length * 5);
      doc.text(wrapped, margin, y);
      doc.text(String(line.quantity), qtyColRight, y, { align: "right" });
      doc.text(line.unitOfMeasure, unitColLeft, y);
      doc.text(formatCurrency(line.lineTotal, line.currency), amountColRight, y, {
        align: "right",
      });
      y += rowHeight;
    }
  }

  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `VAT (${vatPercent}%): ${formatCurrency(invoice.vatAmount, invoice.currency)}`,
    amountColRight,
    y,
    { align: "right" }
  );
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total (ex VAT): ${formatCurrency(invoice.subtotalExVat, invoice.currency)}`,
    amountColRight,
    y,
    { align: "right" }
  );

  y += 14;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`${BRAND.name} · info@axarevents.com`, margin, y);

  const slug = meta.companyName.replace(/[^\w]+/g, "-").slice(0, 24) || "exhibitor";
  doc.save(`${slug}-axarevents-invoice.pdf`);
}
