import fs from "fs";
import path from "path";
import { BRAND } from "@/lib/utils";

export type PartnerBoothReservedParams = {
  exhibitorName: string;
  companyName: string;
  partnerName: string;
  eventTitle: string;
  boothCode: string;
  contactEmail: string;
};

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/lib/email-templates/partner-booth-reserved.html"
);

let cachedSource: string | null = null;

function readTemplateSource() {
  if (!cachedSource) {
    cachedSource = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  }
  return cachedSource;
}

function extractSection(source: string, section: string) {
  const marker = `<!--template:${section}\n`;
  const start = source.indexOf(marker);
  if (start === -1) {
    const altMarker = `<!--template:${section}`;
    const altStart = source.indexOf(altMarker);
    if (altStart === -1) return "";
    const contentStart = source.indexOf("\n", altStart) + 1;
    const end = source.indexOf("\n-->", contentStart);
    return end === -1 ? "" : source.slice(contentStart, end).trim();
  }
  const contentStart = start + marker.length;
  const end = source.indexOf("\n-->", contentStart);
  return end === -1 ? "" : source.slice(contentStart, end).trim();
}

function getMainTemplate(source: string) {
  const fromMarker = extractSection(source, "email");
  if (fromMarker) return fromMarker;
  const idx = source.indexOf("<!--template:");
  return (idx === -1 ? source : source.slice(0, idx)).trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

export function partnerBoothReservedEmailHtml(params: PartnerBoothReservedParams) {
  return fillTemplate(getMainTemplate(readTemplateSource()), {
    brandName: BRAND.name,
    brandTagline: BRAND.tagline,
    exhibitorName: escapeHtml(params.exhibitorName),
    companyName: escapeHtml(params.companyName),
    partnerName: escapeHtml(params.partnerName),
    eventTitle: escapeHtml(params.eventTitle),
    boothCode: escapeHtml(params.boothCode),
    contactEmail: escapeHtml(params.contactEmail),
    year: String(new Date().getFullYear()),
  }).trim();
}

export function partnerBoothReservedEmailSubject(eventTitle: string) {
  return `Booth reserved — ${eventTitle} | ${BRAND.name}`;
}
