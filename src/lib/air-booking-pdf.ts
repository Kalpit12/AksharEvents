import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { fetchAuthenticatedDocumentBuffer } from "@/lib/cloudinary-server";
import type { MemberDocumentType } from "@prisma/client";
import { MEMBER_DOCUMENT_LABELS } from "@/lib/member-document-types";

type MemberDoc = {
  documentType: MemberDocumentType;
  cloudinaryPublicId: string;
  mimeType: string;
  originalFileName: string;
};

function memberDisplayName(member: TeamMember) {
  return `${member.fn} ${member.ln}`.trim();
}

function safePdfFileName(name: string, index: number) {
  const safe = name.replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim() || "Traveller";
  return `${index} ${safe} documents.pdf`;
}

function documentLabel(doc: MemberDoc) {
  return MEMBER_DOCUMENT_LABELS[doc.documentType];
}

function appendDocumentLabelPage(pdf: PDFDocument, label: string, fontBold: PDFFont) {
  const page = pdf.addPage([595, 842]);
  page.drawText(label, {
    x: 48,
    y: 780,
    size: 14,
    font: fontBold,
    color: rgb(0.11, 0.1, 0.09),
  });
}

async function appendImagePage(
  pdf: PDFDocument,
  bytes: Buffer,
  mimeType: string,
  label: string,
  fontBold: PDFFont
) {
  const page = pdf.addPage([595, 842]);
  page.drawText(label, {
    x: 48,
    y: 800,
    size: 12,
    font: fontBold,
    color: rgb(0.11, 0.1, 0.09),
  });

  const embedded =
    mimeType === "image/png"
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
  const { width, height } = embedded.scale(1);
  const maxW = 515;
  const maxH = 700;
  const scale = Math.min(maxW / width, maxH / height, 1);
  const w = width * scale;
  const h = height * scale;
  page.drawImage(embedded, {
    x: (595 - w) / 2,
    y: Math.max(48, (760 - h) / 2),
    width: w,
    height: h,
  });
}

async function appendPdfPages(target: PDFDocument, sourceBytes: Buffer) {
  const source = await PDFDocument.load(sourceBytes);
  const pages = await target.copyPages(source, source.getPageIndices());
  for (const page of pages) {
    target.addPage(page);
  }
}

export async function buildMemberDocumentsPdf({
  member,
  passportNumber,
  documents,
  fileIndex,
}: {
  member: TeamMember;
  passportNumber: string;
  documents: MemberDoc[];
  fileIndex: number;
}): Promise<{ fileName: string; bytes: Uint8Array }> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const cover = pdf.addPage([595, 842]);
  const name = memberDisplayName(member);
  let y = 760;

  const line = (label: string, value: string, bold = false) => {
    cover.drawText(label, { x: 48, y, size: 10, font: fontBold, color: rgb(0.35, 0.33, 0.3) });
    cover.drawText(value, { x: 180, y, size: 11, font: bold ? fontBold : font, color: rgb(0.11, 0.1, 0.09) });
    y -= 22;
  };

  cover.drawText("Flight booking — traveller documents", {
    x: 48,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.11, 0.1, 0.09),
  });
  y -= 36;
  line("Traveller", name, true);
  line("Email", member.email || "—");
  line("Phone", member.phone || "—");
  line("Passport number", passportNumber);
  y -= 12;
  cover.drawText("Documents included in this Pdf.", {
    x: 48,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.11, 0.1, 0.09),
  });
  y -= 20;
  for (const doc of documents) {
    cover.drawText(`• ${documentLabel(doc)}`, {
      x: 56,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.18, 0.16),
    });
    y -= 16;
  }

  const ordered = [...documents].sort((a, b) => a.documentType.localeCompare(b.documentType));
  for (const doc of ordered) {
    const label = documentLabel(doc);
    const resourceType = doc.mimeType === "application/pdf" ? "raw" : "image";
    const bytes = await fetchAuthenticatedDocumentBuffer(doc.cloudinaryPublicId, resourceType);
    if (doc.mimeType === "application/pdf") {
      appendDocumentLabelPage(pdf, label, fontBold);
      await appendPdfPages(pdf, bytes);
    } else if (doc.mimeType.startsWith("image/")) {
      await appendImagePage(pdf, bytes, doc.mimeType, label, fontBold);
    }
  }

  const pdfBytes = await pdf.save();
  return { fileName: safePdfFileName(name, fileIndex), bytes: pdfBytes };
}
