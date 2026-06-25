import type { MemberDocumentType } from "@prisma/client";

export const MEMBER_DOCUMENT_LABELS: Record<MemberDocumentType, string> = {
  PASSPORT: "Passport",
  VISA: "Visa",
  NATIONAL_ID: "National ID",
  YELLOW_FEVER: "Yellow fever certificate",
  OTHER: "Other document",
};

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type SerializedMemberDocument = {
  id: string;
  eventExhibitorId: string;
  memberLocalId: string;
  documentType: MemberDocumentType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
};
