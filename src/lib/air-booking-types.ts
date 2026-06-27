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
