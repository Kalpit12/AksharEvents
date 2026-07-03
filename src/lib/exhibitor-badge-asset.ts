import { formatBadgeDateLabel } from "@/lib/visitor-badge-format";
import { formatExhibitorBadgeCode } from "@/lib/exhibitor-badge-codes";
import { BRAND } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import "server-only";

/** A7 portrait — 74 × 105 mm */
export const A7_WIDTH_PT = (74 / 25.4) * 72;
export const A7_HEIGHT_PT = (105 / 25.4) * 72;

const W = 210;
const H = 298;

const C = {
  alabaster: "#f9f6f0",
  espresso: "#1c1a17",
  champagne: "#c5a880",
  champagneDark: "#b3966e",
  champagneLight: "#d9c9a8",
  muted: "#f4f2ee",
  mutedFg: "#6b7280",
  border: "#e5e7eb",
  foreground: "#1c1a17",
  white: "#ffffff",
} as const;

const FONT = "Arial, Helvetica, sans-serif";

const LANYARD_H = 8;
const HEADER_H = 28;
const FOOTER_H = 11;
const PAD = 10;
const PHOTO_SIZE_MAX = 72;
const QR_SIZE = 48;
const QR_CAPTION_H = 16;

export type ExhibitorBadgeAssetInput = {
  memberName: string;
  memberRole: string;
  companyName: string;
  boothLabel?: string | null;
  eventTitle: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  memberLocalId: string;
  qrDataUrl: string;
  photoBuffer: Buffer;
};

type BadgeLayout = {
  eventY: number;
  eventH: number;
  photoZoneY: number;
  photoZoneH: number;
  photoY: number;
  photoSize: number;
  identityY: number;
  identityH: number;
  qrY: number;
  qrSectionH: number;
  footerY: number;
  titleLines: string[];
  nameLines: string[];
  nameFontSize: number;
  nameY: number;
  roleY: number;
  companyY: number;
  boothPillY: number | null;
  boothPillW: number;
  qrBoxY: number;
  scanY: number;
  codeY: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length >= maxLines - 1) {
      lines.push(`${word.slice(0, maxChars - 1)}…`);
      return lines.slice(0, maxLines);
    }
    current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines.slice(0, maxLines) : [text.slice(0, maxChars)];
}

function svgTextBlock(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  attrs: string
) {
  if (lines.length === 1) {
    return `<text x="${x}" y="${startY}" ${attrs}>${lines[0]}</text>`;
  }
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`)
    .join("");
  return `<text x="${x}" y="${startY}" ${attrs}>${tspans}</text>`;
}

function computeLayout(input: ExhibitorBadgeAssetInput): BadgeLayout {
  const booth = input.boothLabel?.trim() || null;
  const titleLines = wrapText(input.eventTitle, 28, 2);
  const eventH = 16 + titleLines.length * 10 + 10;

  const rawName = input.memberName.trim().toUpperCase() || "—";
  const nameFontSize = rawName.length > 20 ? 9.5 : rawName.length > 15 ? 10.5 : 11.5;
  const nameLines =
    rawName.length > 20 ? wrapText(rawName, 20, 2) : rawName.length > 15 ? wrapText(rawName, 18, 2) : [rawName];

  const boothPillW = booth ? Math.min(W - PAD * 2, Math.max(booth.length * 5.5 + 36, 72)) : 0;
  const boothBlockH = booth ? 26 : 0;
  const identityH =
    8 + nameLines.length * (nameFontSize + 2) + 10 + 10 + boothBlockH + 6;
  const qrSectionH = 8 + QR_SIZE + 8 + QR_CAPTION_H;
  const footerY = H - FOOTER_H;
  const qrY = footerY - qrSectionH;
  const identityY = qrY - identityH;
  const eventY = LANYARD_H + HEADER_H;
  const photoZoneY = eventY + eventH;
  const photoZoneH = identityY - photoZoneY;

  let photoSize = Math.min(PHOTO_SIZE_MAX, photoZoneH - 8);
  photoSize = Math.max(48, Math.min(photoSize, photoZoneH - 4));
  const photoY = photoZoneY + Math.max(2, (photoZoneH - photoSize) / 2);

  const nameY = identityY + 8 + nameFontSize;
  const roleY = nameY + (nameLines.length - 1) * (nameFontSize + 2) + 10;
  const companyY = roleY + 10;
  const boothPillY = booth ? companyY + 14 : null;
  const qrBoxY = qrY + 8;
  const scanY = qrBoxY + QR_SIZE + 10;
  const codeY = scanY + 6;

  return {
    eventY,
    eventH,
    photoZoneY,
    photoZoneH,
    photoY,
    photoSize,
    identityY,
    identityH,
    qrY,
    qrSectionH,
    footerY,
    titleLines: titleLines.map(escapeXml),
    nameLines: nameLines.map(escapeXml),
    nameFontSize,
    nameY,
    roleY,
    companyY,
    boothPillY,
    boothPillW,
    qrBoxY,
    scanY,
    codeY,
  };
}

async function photoToDataUrl(buffer: Buffer, sizePx: number) {
  const png = await sharp(buffer)
    .rotate()
    .resize(sizePx, sizePx, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function buildExhibitorBadgeSvg(input: ExhibitorBadgeAssetInput) {
  const layout = computeLayout(input);
  const badgeCode = formatExhibitorBadgeCode(input.memberLocalId);
  const role = escapeXml(truncate(input.memberRole.trim() || "Exhibitor", 32));
  const company = escapeXml(truncate(input.companyName.trim() || "—", 34));
  const booth = input.boothLabel?.trim() ? escapeXml(truncate(input.boothLabel.trim(), 20)) : null;
  const dateLabel = escapeXml(formatBadgeDateLabel(input.startDate, input.endDate));
  const qrHref = escapeXml(input.qrDataUrl);
  const brandName = escapeXml(BRAND.name);
  const footerText = escapeXml(`Powered by ${BRAND.name}`);

  const photoX = (W - layout.photoSize) / 2;
  const photoDataUrl = await photoToDataUrl(input.photoBuffer, 400);
  const qrX = (W - QR_SIZE) / 2;
  const boothPillX = (W - layout.boothPillW) / 2;
  const logoSize = 20;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="hdr" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.espresso}"/>
      <stop offset="55%" stop-color="${C.espresso}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.champagneDark}"/>
    </linearGradient>
    <linearGradient id="qrBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${C.alabaster}"/>
      <stop offset="100%" stop-color="${C.muted}" stop-opacity="0.35"/>
    </linearGradient>
    <clipPath id="hdrClip"><rect x="0" y="${LANYARD_H}" width="${W}" height="${HEADER_H}"/></clipPath>
    <clipPath id="photoClip"><rect x="${photoX}" y="${layout.photoY}" width="${layout.photoSize}" height="${layout.photoSize}" rx="10"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="${C.white}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="none" stroke="${C.champagne}" stroke-width="1.5" stroke-opacity="0.55"/>

  <!-- Lanyard -->
  <rect y="0" width="${W}" height="${LANYARD_H}" fill="${C.espresso}"/>
  <rect x="${(W - 32) / 2}" y="2" width="32" height="4" rx="2" fill="${C.espresso}" stroke="${C.champagne}" stroke-width="0.8" stroke-opacity="0.45"/>

  <!-- Header -->
  <rect y="${LANYARD_H}" width="${W}" height="${HEADER_H}" fill="url(#hdr)"/>
  <g clip-path="url(#hdrClip)">
    <rect x="${PAD}" y="${LANYARD_H + 4}" width="${logoSize}" height="${logoSize}" rx="5" fill="${C.champagne}"/>
    <text x="${PAD + logoSize / 2}" y="${LANYARD_H + 18}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="700" fill="${C.espresso}">A</text>
    <text x="${PAD + logoSize + 6}" y="${LANYARD_H + 18}" font-family="${FONT}" font-size="9" font-weight="700" fill="${C.alabaster}">${brandName}</text>
    <rect x="${W - PAD - 48}" y="${LANYARD_H + 6}" width="48" height="16" rx="5" fill="${C.champagne}"/>
    <text x="${W - PAD - 24}" y="${LANYARD_H + 17}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="6.5" font-weight="700" letter-spacing="0.05em" fill="${C.espresso}">EXHIBITOR</text>
  </g>

  <!-- Event strip -->
  <rect y="${layout.eventY}" width="${W}" height="${layout.eventH}" fill="${C.muted}" fill-opacity="0.55"/>
  <line x1="0" y1="${layout.eventY + layout.eventH}" x2="${W}" y2="${layout.eventY + layout.eventH}" stroke="${C.border}" stroke-width="1"/>
  <text x="${W / 2}" y="${layout.eventY + 9}" text-anchor="middle" font-family="${FONT}" font-size="6" font-weight="600" fill="${C.mutedFg}" letter-spacing="0.1em">OFFICIAL EXHIBITOR BADGE</text>
  ${svgTextBlock(layout.titleLines, W / 2, layout.eventY + 20, 10, `text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="600" fill="${C.foreground}"`)}
  <text x="${W / 2}" y="${layout.eventY + layout.eventH - 5}" text-anchor="middle" font-family="${FONT}" font-size="6.5" fill="${C.mutedFg}">${dateLabel}</text>

  <!-- Photo zone -->
  <rect y="${layout.photoZoneY}" width="${W}" height="${layout.photoZoneH}" fill="${C.alabaster}" fill-opacity="0.35"/>
  <rect x="${photoX}" y="${layout.photoY}" width="${layout.photoSize}" height="${layout.photoSize}" rx="10" fill="${C.white}" stroke="${C.champagne}" stroke-width="1.2" stroke-opacity="0.55"/>
  <image x="${photoX}" y="${layout.photoY}" width="${layout.photoSize}" height="${layout.photoSize}" href="${photoDataUrl}" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>

  <!-- Identity -->
  <rect y="${layout.identityY}" width="${W}" height="${layout.identityH}" fill="${C.white}"/>
  <line x1="${PAD}" y1="${layout.identityY}" x2="${W - PAD}" y2="${layout.identityY}" stroke="${C.border}" stroke-width="0.8"/>
  ${svgTextBlock(
    layout.nameLines,
    W / 2,
    layout.nameY,
    layout.nameFontSize + 2,
    `text-anchor="middle" font-family="${FONT}" font-size="${layout.nameFontSize}" font-weight="700" fill="${C.espresso}"`
  )}
  <text x="${W / 2}" y="${layout.roleY}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="600" fill="${C.champagneDark}">${role}</text>
  <text x="${W / 2}" y="${layout.companyY}" text-anchor="middle" font-family="${FONT}" font-size="7.5" fill="${C.mutedFg}">${company}</text>
  ${
    booth && layout.boothPillY
      ? `<rect x="${boothPillX}" y="${layout.boothPillY}" width="${layout.boothPillW}" height="14" rx="7" fill="${C.espresso}"/>
  <text x="${W / 2}" y="${layout.boothPillY + 7}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="6.5" font-weight="700" letter-spacing="0.04em" fill="${C.champagneLight}">BOOTH ${booth}</text>`
      : ""
  }

  <!-- QR -->
  <rect y="${layout.qrY}" width="${W}" height="${layout.qrSectionH}" fill="url(#qrBg)"/>
  <line x1="0" y1="${layout.qrY}" x2="${W}" y2="${layout.qrY}" stroke="${C.border}" stroke-width="1" stroke-dasharray="4 4"/>
  <rect x="${qrX - 4}" y="${layout.qrBoxY - 4}" width="${QR_SIZE + 8}" height="${QR_SIZE + 8}" rx="7" fill="${C.white}" stroke="${C.espresso}" stroke-width="1" stroke-opacity="0.08"/>
  <image x="${qrX}" y="${layout.qrBoxY}" width="${QR_SIZE}" height="${QR_SIZE}" xlink:href="${qrHref}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${W / 2}" y="${layout.scanY}" text-anchor="middle" font-family="${FONT}" font-size="6" font-weight="500" fill="${C.mutedFg}">Scan for hall access</text>
  <text x="${W / 2}" y="${layout.codeY}" text-anchor="middle" font-family="Courier New, monospace" font-size="6" fill="${C.mutedFg}" fill-opacity="0.9">${escapeXml(badgeCode)}</text>

  <!-- Footer -->
  <rect y="${layout.footerY}" width="${W}" height="${FOOTER_H}" fill="${C.espresso}"/>
  <text x="${W / 2}" y="${layout.footerY + FOOTER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="5" font-weight="500" fill="${C.champagneLight}" fill-opacity="0.75" letter-spacing="0.08em">${footerText}</text>
</svg>`;
}

async function svgToPng(svg: string, width: number, height: number, scale = 3) {
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .resize(Math.round(width * scale), Math.round(height * scale), { fit: "fill" })
    .png()
    .toBuffer();
}

export async function buildExhibitorBadgePdf(input: ExhibitorBadgeAssetInput) {
  const svg = await buildExhibitorBadgeSvg(input);
  const png = await svgToPng(svg, W, H, 3);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A7_WIDTH_PT, A7_HEIGHT_PT]);
  const image = await pdfDoc.embedPng(png);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: A7_WIDTH_PT,
    height: A7_HEIGHT_PT,
  });

  return pdfDoc.save();
}
