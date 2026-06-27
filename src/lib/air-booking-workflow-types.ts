import type { AirBookingMemberWorkflowStatus } from "@prisma/client";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";

export type SerializedAirBookingMemberWorkflow = {
  id: string;
  eventExhibitorId: string;
  memberLocalId: string;
  status: AirBookingMemberWorkflowStatus;
  rateAmount: number | null;
  rateCurrency: string;
  rateDetails: string | null;
  verifiedAt: string | null;
  rateSentAt: string | null;
  paidAt: string | null;
};

export type MemberFlightStatusKey =
  | "not_requested"
  | "verification_pending"
  | "verified"
  | "rate_sent"
  | "paid"
  | "pending"
  | "sent";

export type MemberFlightStatusView = {
  key: MemberFlightStatusKey;
  label: string;
  rateAmount?: number;
  rateCurrency?: string;
};

export function workflowMap(
  workflows: SerializedAirBookingMemberWorkflow[]
): Map<string, SerializedAirBookingMemberWorkflow> {
  return new Map(workflows.map((w) => [w.memberLocalId, w]));
}

export function memberWasDispatched(
  memberLocalId: string,
  requests: SerializedAirBookingRequest[]
): boolean {
  return requests.some((r) =>
    r.dispatches.some((d) => d.memberLocalIds.includes(memberLocalId))
  );
}

export function memberHasBookingRequest(
  memberLocalId: string,
  requests: SerializedAirBookingRequest[]
): boolean {
  return requests.some((r) => r.memberLocalIds.includes(memberLocalId));
}

export function resolveExhibitorMemberFlightStatus(
  memberLocalId: string,
  workflows: SerializedAirBookingMemberWorkflow[],
  requests: SerializedAirBookingRequest[],
  hasPassportDocument = false
): MemberFlightStatusView {
  const workflow = workflows.find((w) => w.memberLocalId === memberLocalId);
  const dispatched = memberWasDispatched(memberLocalId, requests);

  if (workflow?.status === "PAID") {
    return { key: "paid", label: "Paid" };
  }

  if (workflow?.status === "RATE_SENT") {
    const amount = workflow.rateAmount;
    const currency = workflow.rateCurrency || "KES";
    const label =
      amount != null
        ? `Rate · ${currency} ${amount.toLocaleString()}`
        : "Rate sent";
    return {
      key: "rate_sent",
      label,
      rateAmount: amount ?? undefined,
      rateCurrency: currency,
    };
  }

  if (dispatched) {
    return { key: "sent", label: "Sent" };
  }

  if (workflow?.status === "VERIFIED") {
    return { key: "verified", label: "Verified" };
  }

  if (
    workflow?.status === "VERIFICATION_PENDING" ||
    hasPassportDocument
  ) {
    return { key: "verification_pending", label: "Verification pending" };
  }

  if (memberHasBookingRequest(memberLocalId, requests)) {
    return { key: "pending", label: "Pending" };
  }

  return { key: "not_requested", label: "—" };
}

export function resolveAdminMemberFlightStatus(
  memberLocalId: string,
  workflows: SerializedAirBookingMemberWorkflow[],
  requests: SerializedAirBookingRequest[],
  hasPassportDocument = false
): MemberFlightStatusView {
  const workflow = workflows.find((w) => w.memberLocalId === memberLocalId);
  const dispatched = memberWasDispatched(memberLocalId, requests);

  if (workflow?.status === "PAID") {
    return { key: "paid", label: "Paid" };
  }

  if (workflow?.status === "RATE_SENT") {
    const amount = workflow.rateAmount;
    const currency = workflow.rateCurrency || "KES";
    const label =
      amount != null
        ? `Rate sent · ${currency} ${amount.toLocaleString()}`
        : "Rate sent";
    return {
      key: "rate_sent",
      label,
      rateAmount: amount ?? undefined,
      rateCurrency: currency,
    };
  }

  if (dispatched) {
    return { key: "sent", label: "Sent to agent" };
  }

  if (workflow?.status === "VERIFIED") {
    return { key: "verified", label: "Verified" };
  }

  if (
    workflow?.status === "VERIFICATION_PENDING" ||
    hasPassportDocument ||
    memberHasBookingRequest(memberLocalId, requests)
  ) {
    return { key: "verification_pending", label: "Verification pending" };
  }

  return { key: "not_requested", label: "—" };
}

export function canSendMemberToTravelAgent(
  status?: SerializedAirBookingMemberWorkflow["status"]
): boolean {
  return status === "VERIFIED" || status === "RATE_SENT" || status === "PAID";
}

export function canSendMemberRate(
  status: SerializedAirBookingMemberWorkflow["status"] | undefined,
  dispatched: boolean
): boolean {
  if (status === "RATE_SENT" || status === "PAID") return false;
  return status === "VERIFIED" || dispatched;
}

export function serializeWorkflow(row: {
  id: string;
  eventExhibitorId: string;
  memberLocalId: string;
  status: AirBookingMemberWorkflowStatus;
  rateAmount: { toNumber(): number } | null;
  rateCurrency: string;
  rateDetails: string | null;
  verifiedAt: Date | null;
  rateSentAt: Date | null;
  paidAt: Date | null;
}): SerializedAirBookingMemberWorkflow {
  return {
    id: row.id,
    eventExhibitorId: row.eventExhibitorId,
    memberLocalId: row.memberLocalId,
    status: row.status,
    rateAmount: row.rateAmount?.toNumber() ?? null,
    rateCurrency: row.rateCurrency,
    rateDetails: row.rateDetails,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    rateSentAt: row.rateSentAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}
