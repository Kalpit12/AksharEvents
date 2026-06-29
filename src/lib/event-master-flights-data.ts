"use server";

import { requireRole } from "@/lib/auth";
import { listAirBookingRequestsForEvent } from "@/lib/air-booking-actions";
import { listAirBookingMemberWorkflowsForEvent } from "@/lib/air-booking-workflow-actions";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { SerializedAirBookingMemberWorkflow } from "@/lib/air-booking-workflow-types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import { prisma } from "@/lib/prisma";

export type EventMasterFlightsData = {
  airBookingRequests: SerializedAirBookingRequest[];
  memberDocuments: SerializedMemberDocument[];
  memberWorkflows: SerializedAirBookingMemberWorkflow[];
};

export async function loadEventMasterFlightsData(
  eventId: string
): Promise<{ data?: EventMasterFlightsData; error?: string }> {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const [airBookingRequests, memberDocumentRows, memberWorkflows] = await Promise.all([
    listAirBookingRequestsForEvent(eventId),
    prisma.exhibitorMemberDocument.findMany({
      where: { eventExhibitor: { eventId } },
      orderBy: { createdAt: "desc" },
    }),
    listAirBookingMemberWorkflowsForEvent(eventId),
  ]);

  return {
    data: {
      airBookingRequests,
      memberWorkflows,
      memberDocuments: memberDocumentRows.map((doc) => ({
        id: doc.id,
        eventExhibitorId: doc.eventExhibitorId,
        memberLocalId: doc.memberLocalId,
        documentType: doc.documentType,
        originalFileName: doc.originalFileName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.createdAt.toISOString(),
      })),
    },
  };
}
