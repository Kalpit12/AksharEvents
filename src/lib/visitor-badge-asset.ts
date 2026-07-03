import { formatEventVenue } from "@/lib/event-schedule-label";
import { formatBadgeDateLabel } from "@/lib/visitor-badge-format";
import { BRAND } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import "server-only";

export type VisitorBadgeAssetInput = {
  attendeeName: string;
  attendeeDesignation?: string | null;
  eventTitle: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  venueName?: string | null;
  venueCity?: string | null;
  bookingNumber: string;
  passLabel?: string;
  qrDataUrl: string;
};

/** Matches EventVisitorBadge card width (max-w-[340px]). */
export const BADGE_WIDTH = 340;

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

const LANYARD_H = 28;
const HEADER_H = 72;
const FOOTER_H = 32;
const PAD = 20;
const QR_BOX = 220;
const QR_PAD = 12;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

type BadgeLayout = {
  width: number;
  height: number;
  headerY: number;
  eventY: number;
  eventH: number;
  attendeeY: number;
  attendeeH: number;
  qrY: number;
  qrSectionH: number;
  qrBoxY: number;
  footerY: number;
  titleLines: string[];
  venueLines: string[];
  nameLines: string[];
  nameFontSize: number;
  nameLabelY: number;
  nameValueY: number;
  designationLabelY: number;
  passPillW: number;
  passPillX: number;
};

function computeBadgeLayout(input: VisitorBadgeAssetInput): BadgeLayout {
  const passLabel = (input.passLabel ?? "VISITOR").toUpperCase();
  const designation = input.attendeeDesignation?.trim();
  const venue = formatEventVenue(input.venueName, input.venueCity);

  const titleLines = wrapText(input.eventTitle, 36, 2);
  const venueLines = venue ? wrapText(venue, 40, 2) : [];

  const eventH =
    44 + titleLines.length * 17 + 16 + (venueLines.length ? 8 + venueLines.length * 14 : 0);

  const rawName = input.attendeeName.trim().toUpperCase() || "—";
  const nameFontSize = rawName.length > 24 ? 18 : rawName.length > 18 ? 20 : 24;
  const nameLines =
    rawName.length > 24 ? wrapText(rawName, 22, 2) : rawName.length > 18 ? wrapText(rawName, 18, 2) : [rawName];

  const nameLabelOffset = 22;
  const labelToNameGap = 26;
  const nameLineGap = nameFontSize + 8;
  const nameBlockHeight = labelToNameGap + nameLines.length * nameLineGap;
  const designationBlockHeight = designation ? 50 : 0;
  const attendeeH = nameLabelOffset + nameBlockHeight + designationBlockHeight + 20;

  const captionBlock = 44;
  const qrSectionH = 18 + QR_BOX + captionBlock + 14;
  const height = LANYARD_H + HEADER_H + eventH + attendeeH + qrSectionH + FOOTER_H;

  const headerY = LANYARD_H;
  const eventY = headerY + HEADER_H;
  const attendeeY = eventY + eventH;
  const nameLabelY = attendeeY + nameLabelOffset;
  const nameValueY = nameLabelY + labelToNameGap;
  const designationLabelY = nameValueY + nameLines.length * nameLineGap + 18;
  const qrY = attendeeY + attendeeH;
  const footerY = height - FOOTER_H;
  const qrBoxY = qrY + 18;

  const passPillW = Math.max(passLabel.length * 7 + 22, 64);
  const passPillX = BADGE_WIDTH - PAD - passPillW;

  return {
    width: BADGE_WIDTH,
    height,
    headerY,
    eventY,
    eventH,
    attendeeY,
    attendeeH,
    qrY,
    qrSectionH,
    qrBoxY,
    footerY,
    titleLines: titleLines.map(escapeXml),
    venueLines: venueLines.map(escapeXml),
    nameLines: nameLines.map(escapeXml),
    nameFontSize,
    nameLabelY,
    nameValueY,
    designationLabelY,
    passPillW,
    passPillX,
  };
}

function calendarIcon(x: number, y: number) {
  return `<g transform="translate(${x},${y})" stroke="${C.mutedFg}" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="2" width="10" height="9" rx="1"/>
    <path d="M1 5h10M3.5 1v2M8.5 1v2"/>
  </g>`;
}

function mapPinIcon(x: number, y: number) {
  return `<g transform="translate(${x},${y})" fill="${C.mutedFg}">
    <path d="M6 0C3.79 0 2 1.79 2 4c0 2.75 4 8 4 8s4-5.25 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" transform="scale(0.85)"/>
  </g>`;
}

/**
 * Single-source SVG badge — mirrors `EventVisitorBadge` (register page live preview).
 */
export function buildVisitorBadgeSvg(
  input: VisitorBadgeAssetInput,
  options: { omitInlineQr?: boolean } = {}
) {
  const layout = computeBadgeLayout(input);
  const passLabel = escapeXml((input.passLabel ?? "VISITOR").toUpperCase());
  const designation = input.attendeeDesignation?.trim();
  const dateLabel = escapeXml(formatBadgeDateLabel(input.startDate, input.endDate));
  const bookingNumber = escapeXml(input.bookingNumber);
  const qrHref = escapeXml(input.qrDataUrl);
  const tagline = escapeXml(BRAND.tagline);
  const brandName = escapeXml(BRAND.name);
  const footerText = escapeXml(`Powered by ${BRAND.name}`);

  const W = layout.width;
  const H = layout.height;
  const qrBoxX = (W - QR_BOX) / 2;
  const qrImgSize = QR_BOX - QR_PAD * 2;
  const qrImageTag = options.omitInlineQr
    ? ""
    : `<image x="${qrBoxX + QR_PAD}" y="${layout.qrBoxY + QR_PAD}" width="${qrImgSize}" height="${qrImgSize}" xlink:href="${qrHref}" preserveAspectRatio="xMidYMid meet"/>`;

  const dateY = layout.eventY + 44 + layout.titleLines.length * 17;
  const venueStartY = dateY + 18;

  const scanY = layout.qrBoxY + QR_BOX + 20;
  const bookingY = scanY + 16;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C.espresso}"/>
      <stop offset="55%" stop-color="${C.espresso}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${C.champagneDark}"/>
    </linearGradient>
    <linearGradient id="qrBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${C.alabaster}"/>
      <stop offset="100%" stop-color="${C.muted}" stop-opacity="0.35"/>
    </linearGradient>
    <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="16"/></clipPath>
  </defs>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="none" stroke="${C.champagne}" stroke-width="2" stroke-opacity="0.5"/>

  <g clip-path="url(#cardClip)">
    <rect width="${W}" height="${H}" fill="${C.white}"/>

    <!-- Lanyard slot -->
    <rect y="0" width="${W}" height="${LANYARD_H}" fill="${C.espresso}"/>
    <rect x="${(W - 48) / 2}" y="8" width="48" height="12" rx="6" fill="${C.espresso}" stroke="${C.champagne}" stroke-width="1.5" stroke-opacity="0.4"/>

    <!-- Header -->
    <rect y="${layout.headerY}" width="${W}" height="${HEADER_H}" fill="url(#headerGrad)"/>
    <rect x="${PAD}" y="${layout.headerY + 16}" width="40" height="40" rx="8" fill="${C.champagne}"/>
    <text x="${PAD + 20}" y="${layout.headerY + 44}" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.espresso}">A</text>
    <text x="${PAD + 50}" y="${layout.headerY + 32}" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.alabaster}">${brandName}</text>
    <text x="${PAD + 50}" y="${layout.headerY + 48}" font-family="${FONT}" font-size="9" font-weight="400" fill="${C.champagneLight}" fill-opacity="0.75" letter-spacing="0.04em">${tagline.toUpperCase()}</text>
    <rect x="${layout.passPillX}" y="${layout.headerY + 20}" width="${layout.passPillW}" height="22" rx="6" fill="${C.champagne}"/>
    <text x="${layout.passPillX + layout.passPillW / 2}" y="${layout.headerY + 35}" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" letter-spacing="0.04em" fill="${C.espresso}">${passLabel}</text>

    <!-- Event strip -->
    <rect y="${layout.eventY}" width="${W}" height="${layout.eventH}" fill="${C.muted}" fill-opacity="0.55"/>
    <line x1="0" y1="${layout.eventY + layout.eventH}" x2="${W}" y2="${layout.eventY + layout.eventH}" stroke="${C.border}" stroke-width="1"/>
    <text x="${PAD}" y="${layout.eventY + 22}" font-family="${FONT}" font-size="10" font-weight="600" fill="${C.mutedFg}" letter-spacing="0.06em">Official event badge</text>
    ${svgTextBlock(layout.titleLines, PAD, layout.eventY + 40, 17, `font-family="${FONT}" font-size="14" font-weight="600" fill="${C.foreground}"`)}
    ${calendarIcon(PAD, dateY)}
    <text x="${PAD + 16}" y="${dateY + 10}" font-family="${FONT}" font-size="11" fill="${C.mutedFg}">${dateLabel}</text>
    ${
      layout.venueLines.length
        ? `${mapPinIcon(PAD, venueStartY)}
    ${svgTextBlock(layout.venueLines, PAD + 16, venueStartY + 10, 14, `font-family="${FONT}" font-size="11" fill="${C.mutedFg}"`)}`
        : ""
    }

    <!-- Attendee -->
    <rect y="${layout.attendeeY}" width="${W}" height="${layout.attendeeH}" fill="${C.white}"/>
    <text x="${W / 2}" y="${layout.nameLabelY}" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="${C.mutedFg}" letter-spacing="0.14em">Name</text>
    ${svgTextBlock(
      layout.nameLines,
      W / 2,
      layout.nameValueY,
      layout.nameFontSize + 8,
      `text-anchor="middle" font-family="${FONT}" font-size="${layout.nameFontSize}" font-weight="700" fill="${C.espresso}"`
    )}
    ${
      designation
        ? `<text x="${W / 2}" y="${layout.designationLabelY}" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="600" fill="${C.mutedFg}" letter-spacing="0.14em">Designation</text>
    <text x="${W / 2}" y="${layout.designationLabelY + 22}" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.champagne}">${escapeXml(designation)}</text>`
        : ""
    }

    <!-- QR section -->
    <rect y="${layout.qrY}" width="${W}" height="${layout.qrSectionH}" fill="url(#qrBgGrad)"/>
    <line x1="0" y1="${layout.qrY}" x2="${W}" y2="${layout.qrY}" stroke="${C.border}" stroke-width="1" stroke-dasharray="5 5"/>
    <rect x="${qrBoxX}" y="${layout.qrBoxY}" width="${QR_BOX}" height="${QR_BOX}" rx="12" fill="${C.white}" stroke="${C.espresso}" stroke-width="1.5" stroke-opacity="0.1"/>
    ${qrImageTag}
    <text x="${W / 2}" y="${scanY}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="500" fill="${C.mutedFg}">Scan at entrance for check-in</text>
    <text x="${W / 2}" y="${bookingY}" text-anchor="middle" font-family="Courier New, monospace" font-size="10" fill="${C.mutedFg}" fill-opacity="0.85">${bookingNumber}</text>

    <!-- Footer -->
    <rect y="${layout.footerY}" width="${W}" height="${FOOTER_H}" fill="${C.espresso}"/>
    <text x="${W / 2}" y="${layout.footerY + 20}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="500" fill="${C.champagneLight}" fill-opacity="0.85" letter-spacing="0.02em">${footerText}</text>
  </g>
</svg>`;
}

export function dataUrlToBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
  return match?.[1]?.replace(/\s/g, "") ?? "";
}

async function qrDataUrlToPngBuffer(dataUrl: string, sizePx: number): Promise<Buffer> {
  const base64 = dataUrlToBase64(dataUrl);
  if (!base64) {
    throw new Error("Invalid QR code data URL");
  }
  return sharp(Buffer.from(base64, "base64"))
    .resize(sizePx, sizePx, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
}

/** Rasterise badge and composite QR via sharp (reliable for PDF/email attachments). */
export async function renderVisitorBadgePng(
  input: VisitorBadgeAssetInput,
  scale = 2
): Promise<Buffer> {
  const layout = computeBadgeLayout(input);
  const svg = buildVisitorBadgeSvg(input, { omitInlineQr: true });
  const basePng = await svgToPng(svg, layout.width, layout.height, scale);

  const qrBoxX = (layout.width - QR_BOX) / 2;
  const qrImgSize = QR_BOX - QR_PAD * 2;
  const qrLeft = Math.round((qrBoxX + QR_PAD) * scale);
  const qrTop = Math.round((layout.qrBoxY + QR_PAD) * scale);
  const qrSizePx = Math.round(qrImgSize * scale);
  const qrOverlay = await qrDataUrlToPngBuffer(input.qrDataUrl, qrSizePx);

  return sharp(basePng)
    .composite([{ input: qrOverlay, left: qrLeft, top: qrTop }])
    .png()
    .toBuffer();
}

export function svgToBase64(svg: string) {
  return Buffer.from(svg, "utf-8").toString("base64");
}

export function pdfToBase64(pdf: Uint8Array) {
  return Buffer.from(pdf).toString("base64");
}

/** Rasterise badge SVG at 2× for crisp print/PDF output. */
export async function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .resize(width * scale, height * scale, { fit: "fill" })
    .png()
    .toBuffer();
}

/** PDF = embedded 2× PNG scaled to badge dimensions (matches live preview). */
export async function buildVisitorBadgePdf(input: VisitorBadgeAssetInput) {
  const layout = computeBadgeLayout(input);
  const png = await renderVisitorBadgePng(input, 2);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([layout.width, layout.height]);
  const image = await pdfDoc.embedPng(png);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: layout.width,
    height: layout.height,
  });

  return pdfDoc.save();
}

/** @deprecated Use dynamic height from layout; kept for layout references. */
export const BADGE_HEIGHT = 680;
