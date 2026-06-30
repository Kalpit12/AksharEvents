import type { BrandingArtworkStatus } from "@prisma/client";
import type { SerializedBrandingArtworkStatusHistory } from "@/lib/branding-artwork-history";

export const BRANDING_ARTWORK_STATUS_LABELS: Record<BrandingArtworkStatus, string> = {
  DRAFT: "Draft — not submitted",
  SUBMITTED: "Submitted — awaiting review",
  NOT_VERIFIED: "Not verified",
  VERIFIED: "Verified",
  SENT_FOR_PRINTING: "Sent for printing",
  PRINTING_IN_PROCESS: "Printing in process",
  ARTWORK_DELIVERED: "Artwork delivered",
  ARTWORK_AFFIXED: "Artwork affixed",
};

export const BRANDING_ARTWORK_STATUS_BADGE: Record<BrandingArtworkStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  NOT_VERIFIED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  SENT_FOR_PRINTING: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  PRINTING_IN_PROCESS: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  ARTWORK_DELIVERED: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  ARTWORK_AFFIXED: "bg-primary/15 text-primary",
};

export const ALLOWED_BRANDING_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/postscript",
  "application/illustrator",
]);

export const MAX_BRANDING_ARTWORK_BYTES = 25 * 1024 * 1024;

export type CloudinaryResourceType = "image" | "raw" | "video";

export function brandingArtworkResourceTypeFromMime(
  mimeType: string | null | undefined
): "image" | "raw" {
  if (!mimeType) return "image";
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/postscript" ||
    mimeType === "application/illustrator"
  ) {
    return "raw";
  }
  return "image";
}

export function parseCloudinaryResourceType(
  value: string | null | undefined
): CloudinaryResourceType | null {
  if (value === "image" || value === "raw" || value === "video") return value;
  return null;
}

export type SerializedBrandingArtworkSubmission = {
  id: string;
  eventExhibitorId: string;
  itemMasterId: string;
  itemName: string;
  itemCategory: string;
  cloudinaryPublicId: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: BrandingArtworkStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

export type AdminBrandingArtworkRecord = SerializedBrandingArtworkSubmission & {
  companyName: string;
  boothNumber: string | null;
  hall: string | null;
  contactName: string | null;
  contactEmail: string | null;
  statusHistory: SerializedBrandingArtworkStatusHistory[];
};

export function canExhibitorEditArtwork(status: BrandingArtworkStatus) {
  return status === "DRAFT" || status === "NOT_VERIFIED";
}

export function isArtworkLocked(status: BrandingArtworkStatus) {
  return !canExhibitorEditArtwork(status);
}

const PRINTING_PIPELINE: BrandingArtworkStatus[] = [
  "VERIFIED",
  "SENT_FOR_PRINTING",
  "PRINTING_IN_PROCESS",
  "ARTWORK_DELIVERED",
  "ARTWORK_AFFIXED",
];

export function nextPrintingStatus(
  current: BrandingArtworkStatus
): BrandingArtworkStatus | null {
  const idx = PRINTING_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= PRINTING_PIPELINE.length - 1) return null;
  return PRINTING_PIPELINE[idx + 1]!;
}

export function printingStaffActionsFor(status: BrandingArtworkStatus): {
  canVerify: boolean;
  canReject: boolean;
  canAdvance: boolean;
  nextStatus: BrandingArtworkStatus | null;
} {
  if (status === "SUBMITTED") {
    return { canVerify: true, canReject: true, canAdvance: false, nextStatus: null };
  }
  const next = nextPrintingStatus(status);
  return {
    canVerify: false,
    canReject: false,
    canAdvance: next !== null,
    nextStatus: next,
  };
}

export function serializeBrandingArtworkSubmission(row: {
  id: string;
  eventExhibitorId: string;
  itemMasterId: string;
  cloudinaryPublicId: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: BrandingArtworkStatus;
  rejectionReason: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  itemMaster: { name: string; category: string };
}): SerializedBrandingArtworkSubmission {
  return {
    id: row.id,
    eventExhibitorId: row.eventExhibitorId,
    itemMasterId: row.itemMasterId,
    itemName: row.itemMaster.name,
    itemCategory: row.itemMaster.category,
    cloudinaryPublicId: row.cloudinaryPublicId,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    status: row.status,
    rejectionReason: row.rejectionReason,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
