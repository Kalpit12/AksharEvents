import type { BrandingArtworkStatus, Prisma } from "@prisma/client";
import type { SerializedBrandingArtworkSubmission } from "@/lib/branding-artwork-types";

const LEGACY_PIPELINE: BrandingArtworkStatus[] = [
  "SUBMITTED",
  "VERIFIED",
  "SENT_FOR_PRINTING",
  "PRINTING_IN_PROCESS",
  "ARTWORK_DELIVERED",
  "ARTWORK_AFFIXED",
];

export type SerializedBrandingArtworkStatusHistory = {
  id: string;
  status: BrandingArtworkStatus;
  rejectionReason: string | null;
  note: string | null;
  changedByName: string | null;
  createdAt: string;
};

type HistoryRow = {
  id: string;
  status: BrandingArtworkStatus;
  rejectionReason: string | null;
  note: string | null;
  createdAt: Date;
  changedBy: { name: string | null } | null;
};

export function serializeBrandingStatusHistory(
  row: HistoryRow
): SerializedBrandingArtworkStatusHistory {
  return {
    id: row.id,
    status: row.status,
    rejectionReason: row.rejectionReason,
    note: row.note,
    changedByName: row.changedBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordBrandingStatusHistory(
  tx: Prisma.TransactionClient,
  input: {
    submissionId: string;
    status: BrandingArtworkStatus;
    rejectionReason?: string | null;
    note?: string | null;
    changedById?: string | null;
  }
) {
  await tx.brandingArtworkStatusHistory.create({
    data: {
      submissionId: input.submissionId,
      status: input.status,
      rejectionReason: input.rejectionReason ?? null,
      note: input.note ?? null,
      changedById: input.changedById ?? null,
    },
  });
}

/** Fallback timeline for submissions created before status history existed. */
export function resolveBrandingStatusTimeline(
  submission: Pick<
    SerializedBrandingArtworkSubmission,
    "status" | "submittedAt" | "updatedAt" | "rejectionReason"
  >,
  history: SerializedBrandingArtworkStatusHistory[]
): SerializedBrandingArtworkStatusHistory[] {
  if (history.length > 0) {
    return [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  const fallback: SerializedBrandingArtworkStatusHistory[] = [];

  if (submission.submittedAt) {
    fallback.push({
      id: "legacy-submitted",
      status: "SUBMITTED",
      rejectionReason: null,
      note: null,
      changedByName: null,
      createdAt: submission.submittedAt,
    });
  }

  const pipelineEnd = LEGACY_PIPELINE.indexOf(submission.status);
  if (pipelineEnd > 0 && submission.submittedAt) {
    for (let i = 1; i <= pipelineEnd; i++) {
      const status = LEGACY_PIPELINE[i]!;
      fallback.push({
        id: `legacy-${status}`,
        status,
        rejectionReason: null,
        note: i === pipelineEnd ? "Estimated from current status" : null,
        changedByName: null,
        createdAt:
          i === pipelineEnd
            ? submission.updatedAt
            : submission.submittedAt,
      });
    }
  } else if (submission.status === "NOT_VERIFIED") {
    fallback.push({
      id: "legacy-not-verified",
      status: "NOT_VERIFIED",
      rejectionReason: submission.rejectionReason,
      note: null,
      changedByName: null,
      createdAt: submission.updatedAt,
    });
  } else if (
    submission.status !== "DRAFT" &&
    submission.status !== "SUBMITTED" &&
    submission.updatedAt !== submission.submittedAt
  ) {
    fallback.push({
      id: `legacy-${submission.status}`,
      status: submission.status,
      rejectionReason: null,
      note: null,
      changedByName: null,
      createdAt: submission.updatedAt,
    });
  }

  return fallback;
}
