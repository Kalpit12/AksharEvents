import type { AirBookingRequestStatus } from "@prisma/client";

export type MemberAirBookingStatus = "not_requested" | "pending" | "sent";

export function getMemberAirBookingStatus(
  memberLocalId: string,
  requests: SerializedAirBookingRequest[]
): MemberAirBookingStatus {
  const requested = requests.some((r) => r.memberLocalIds.includes(memberLocalId));
  if (!requested) return "not_requested";

  const dispatched = requests.some((r) =>
    r.dispatches.some((d) => d.memberLocalIds.includes(memberLocalId))
  );
  return dispatched ? "sent" : "pending";
}

export function memberIdsWithAirBookingRequest(
  requests: SerializedAirBookingRequest[]
): Set<string> {
  const ids = new Set<string>();
  for (const request of requests) {
    for (const id of request.memberLocalIds) {
      ids.add(id);
    }
  }
  return ids;
}

export type SerializedAirBookingRequest = {
  id: string;
  eventExhibitorId: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  ticketCount: number;
  travelDate: string;
  notes: string | null;
  memberLocalIds: string[];
  status: AirBookingRequestStatus;
  requestedAt: string;
  dispatches: {
    id: string;
    recipientEmail: string;
    memberLocalIds: string[];
    sentAt: string;
    message: string | null;
  }[];
};

export function serializeAirBookingRequest(
  request: {
    id: string;
    eventExhibitorId: string;
    ticketCount: number;
    travelDate: Date;
    notes: string | null;
    memberLocalIds: string[];
    status: AirBookingRequestStatus;
    createdAt: Date;
  },
  companyName: string,
  extra?: {
    contactName?: string | null;
    contactEmail?: string | null;
    dispatches?: {
      id: string;
      recipientEmail: string;
      memberLocalIds: string[];
      sentAt: Date;
      message: string | null;
    }[];
  }
): SerializedAirBookingRequest {
  return {
    id: request.id,
    eventExhibitorId: request.eventExhibitorId,
    companyName,
    contactName: extra?.contactName ?? null,
    contactEmail: extra?.contactEmail ?? null,
    ticketCount: request.ticketCount,
    travelDate: request.travelDate.toISOString(),
    notes: request.notes,
    memberLocalIds: request.memberLocalIds,
    status: request.status,
    requestedAt: request.createdAt.toISOString(),
    dispatches: (extra?.dispatches ?? []).map((d) => ({
      id: d.id,
      recipientEmail: d.recipientEmail,
      memberLocalIds: d.memberLocalIds,
      sentAt: d.sentAt.toISOString(),
      message: d.message,
    })),
  };
}
