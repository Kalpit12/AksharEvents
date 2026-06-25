import type { AirBookingRequestStatus } from "@prisma/client";

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
