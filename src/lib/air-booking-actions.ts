"use server";

import { revalidatePath } from "next/cache";
import type { MemberDocumentType } from "@prisma/client";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { createAuditLog } from "@/lib/audit";
import { buildMemberDocumentsPdf } from "@/lib/air-booking-pdf";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import { sendFlightBookingPackageEmail, sendFlightBookingRequestNotification } from "@/lib/email";
import { getEventExhibitorForUser, requireExhibitorAccess } from "@/lib/exhibitor";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { z } from "zod";

const createRequestSchema = z.object({
  eventExhibitorId: z.string().min(1),
  travelDate: z.string().min(1),
  notes: z.string().max(2000).optional(),
  memberLocalIds: z.array(z.string().min(1)).min(1).max(50),
});

const sendPackageSchema = z.object({
  requestId: z.string().min(1),
  recipientEmail: z.string().email(),
  memberLocalIds: z.array(z.string().min(1)).min(1).max(50),
  message: z.string().max(4000).optional(),
});

const sendCombinedPackageSchema = z.object({
  eventExhibitorId: z.string().min(1),
  recipientEmail: z.string().email(),
  message: z.string().max(4000).optional(),
  packages: z
    .array(
      z.object({
        requestId: z.string().min(1),
        memberLocalIds: z.array(z.string().min(1)).min(1).max(50),
      })
    )
    .min(1)
    .max(20),
});

async function assertExhibitorOwnsEventExhibitor(userId: string, eventExhibitorId: string) {
  const access = await requireExhibitorAccess(userId);
  if (!access) return null;
  const entry = await prisma.eventExhibitor.findFirst({
    where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
    include: {
      exhibitor: true,
      event: { select: { title: true } },
      registration: true,
    },
  });
  return entry;
}

function membersFromFormData(formData: unknown): TeamMember[] {
  if (!formData || typeof formData !== "object") return [];
  const members = (formData as SavedRegistrationData).members;
  return Array.isArray(members) ? members : [];
}

export async function listMemberDocuments(eventExhibitorId: string): Promise<{
  success?: boolean;
  documents?: SerializedMemberDocument[];
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    const entry = await assertExhibitorOwnsEventExhibitor(user.id, eventExhibitorId);
    if (!entry) return { error: "Access denied" };
  }

  const documents = await prisma.exhibitorMemberDocument.findMany({
    where: { eventExhibitorId },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    documents: documents.map((doc) => ({
      id: doc.id,
      eventExhibitorId: doc.eventExhibitorId,
      memberLocalId: doc.memberLocalId,
      documentType: doc.documentType,
      originalFileName: doc.originalFileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedAt: doc.createdAt.toISOString(),
    })),
  };
}

export async function createAirBookingRequest(input: z.infer<typeof createRequestSchema>) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request" };

  const entry = await assertExhibitorOwnsEventExhibitor(user.id, parsed.data.eventExhibitorId);
  if (!entry) return { error: "Event registration not found" };

  const members = membersFromFormData(entry.registration?.formData);
  const selected = members.filter((m) => parsed.data.memberLocalIds.includes(m.id));
  if (selected.length !== parsed.data.memberLocalIds.length) {
    return { error: "One or more selected team members were not found" };
  }

  for (const member of selected) {
    if (!member.passportNumber?.trim()) {
      return { error: `${member.fn} ${member.ln} is missing a passport number` };
    }
    const passportDoc = await prisma.exhibitorMemberDocument.findUnique({
      where: {
        eventExhibitorId_memberLocalId_documentType: {
          eventExhibitorId: parsed.data.eventExhibitorId,
          memberLocalId: member.id,
          documentType: "PASSPORT",
        },
      },
    });
    if (!passportDoc) {
      return { error: `Please upload a passport document for ${member.fn} ${member.ln}` };
    }
  }

  const travelDate = new Date(parsed.data.travelDate);
  if (Number.isNaN(travelDate.getTime())) return { error: "Invalid travel date" };

  const request = await withDbRetry(() =>
    prisma.airBookingRequest.create({
      data: {
        eventExhibitorId: parsed.data.eventExhibitorId,
        ticketCount: selected.length,
        travelDate,
        notes: parsed.data.notes?.trim() || null,
        memberLocalIds: parsed.data.memberLocalIds,
        requestedById: user.id,
      },
      include: {
        eventExhibitor: { include: { exhibitor: true, event: { select: { title: true } } } },
      },
    })
  );

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "AirBookingRequest",
    entityId: request.id,
    details: { memberLocalIds: parsed.data.memberLocalIds },
  });

  await sendFlightBookingRequestNotification({
    companyName: request.eventExhibitor.exhibitor.companyName,
    eventTitle: request.eventExhibitor.event.title,
    travelDate: formatDate(travelDate.toISOString(), "MMM d, yyyy"),
    ticketCount: selected.length,
    memberNames: selected.map((m) => `${m.fn} ${m.ln}`),
  });

  revalidatePath("/exhibitor");
  revalidatePath("/admin");

  return {
    success: true,
    request: serializeRequest(request, request.eventExhibitor.exhibitor.companyName),
  };
}

export async function listAirBookingRequestsForEvent(eventId: string): Promise<SerializedAirBookingRequest[]> {
  const user = await requireRole("ADMIN");
  if (!user) return [];

  const requests = await prisma.airBookingRequest.findMany({
    where: { eventExhibitor: { eventId } },
    include: {
      eventExhibitor: { include: { exhibitor: true } },
      dispatches: { orderBy: { sentAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) =>
    serializeRequest(r, r.eventExhibitor.exhibitor.companyName, {
      contactName: r.eventExhibitor.exhibitor.contactName,
      contactEmail: r.eventExhibitor.exhibitor.contactEmail,
      dispatches: r.dispatches,
    })
  );
}

export async function listAirBookingRequestsForExhibitor(eventExhibitorId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    const entry = await assertExhibitorOwnsEventExhibitor(user.id, eventExhibitorId);
    if (!entry) return { error: "Access denied" };
  }

  const requests = await prisma.airBookingRequest.findMany({
    where: { eventExhibitorId },
    include: {
      eventExhibitor: { include: { exhibitor: true } },
      dispatches: { orderBy: { sentAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    requests: requests.map((r) =>
      serializeRequest(r, r.eventExhibitor.exhibitor.companyName, { dispatches: r.dispatches })
    ),
  };
}

export async function sendAirBookingPackageToAgent(input: z.infer<typeof sendPackageSchema>) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const parsed = sendPackageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const request = await prisma.airBookingRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: {
      eventExhibitor: {
        include: {
          exhibitor: true,
          event: { select: { title: true } },
          registration: true,
        },
      },
    },
  });
  if (!request) return { error: "Flight booking request not found" };

  const members = membersFromFormData(request.eventExhibitor.registration?.formData);
  const selectedMembers = members.filter((m) => parsed.data.memberLocalIds.includes(m.id));
  if (selectedMembers.length === 0) return { error: "No valid members selected" };

  const travelDateLabel = formatDate(request.travelDate.toISOString(), "MMM d, yyyy");
  const attachments: { name: string; content: string; contentType: string }[] = [];

  for (const member of selectedMembers) {
    const docs = await prisma.exhibitorMemberDocument.findMany({
      where: {
        eventExhibitorId: request.eventExhibitorId,
        memberLocalId: member.id,
      },
    });
    if (!docs.some((d) => d.documentType === "PASSPORT")) {
      return { error: `Missing passport document for ${member.fn} ${member.ln}` };
    }

    const { fileName, bytes } = await buildMemberDocumentsPdf({
      member,
      passportNumber: member.passportNumber?.trim() || "—",
      fileIndex: 1,
      documents: docs.map((d) => ({
        documentType: d.documentType as MemberDocumentType,
        cloudinaryPublicId: d.cloudinaryPublicId,
        mimeType: d.mimeType,
        originalFileName: d.originalFileName,
      })),
    });

    attachments.push({
      name: fileName,
      content: Buffer.from(bytes).toString("base64"),
      contentType: "application/pdf",
    });
  }

  const emailResult = await sendFlightBookingPackageEmail({
    to: parsed.data.recipientEmail,
    cc: process.env.FLIGHT_BOOKING_CC_EMAIL || process.env.POSTMARK_SENDER_EMAIL || undefined,
    companyName: request.eventExhibitor.exhibitor.companyName,
    eventTitle: request.eventExhibitor.event.title,
    travelDate: travelDateLabel,
    ticketCount: selectedMembers.length,
    members: selectedMembers.map((m) => ({
      name: `${m.fn} ${m.ln}`,
      email: m.email,
      phone: m.phone,
      passportNumber: m.passportNumber?.trim() || "—",
    })),
    message: parsed.data.message,
    attachments,
  });

  if (!emailResult.success) {
    return { error: emailResult.error ?? "Failed to send email" };
  }

  const dispatch = await prisma.$transaction(async (tx) => {
    const created = await tx.airBookingDispatch.create({
      data: {
        airBookingRequestId: request.id,
        sentById: user.id,
        recipientEmail: parsed.data.recipientEmail,
        memberLocalIds: parsed.data.memberLocalIds,
        postmarkMessageId: emailResult.id,
        message: parsed.data.message?.trim() || null,
      },
    });
    await tx.airBookingRequest.update({
      where: { id: request.id },
      data: { status: "SENT" },
    });
    return created;
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "AirBookingDispatch",
    entityId: dispatch.id,
    details: {
      requestId: request.id,
      recipientEmail: parsed.data.recipientEmail,
      memberLocalIds: parsed.data.memberLocalIds,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return { success: true, dispatchId: dispatch.id };
}

export async function sendCombinedAirBookingPackageToAgent(
  input: z.infer<typeof sendCombinedPackageSchema>
) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const parsed = sendCombinedPackageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const requestIds = parsed.data.packages.map((pkg) => pkg.requestId);
  const requests = await prisma.airBookingRequest.findMany({
    where: {
      id: { in: requestIds },
      eventExhibitorId: parsed.data.eventExhibitorId,
    },
    include: {
      eventExhibitor: {
        include: {
          exhibitor: true,
          event: { select: { title: true } },
          registration: true,
        },
      },
    },
  });

  if (requests.length !== parsed.data.packages.length) {
    return { error: "One or more flight booking requests were not found" };
  }

  const allMembers = membersFromFormData(requests[0]!.eventExhibitor.registration?.formData);
  const orderedMembers: TeamMember[] = [];
  const packagesToRecord: { requestId: string; memberLocalIds: string[] }[] = [];

  for (const pkg of parsed.data.packages) {
    const memberIds: string[] = [];
    for (const memberId of pkg.memberLocalIds) {
      const member = allMembers.find((m) => m.id === memberId);
      if (!member) continue;
      if (!orderedMembers.some((m) => m.id === memberId)) {
        orderedMembers.push(member);
      }
      memberIds.push(memberId);
    }
    if (memberIds.length > 0) {
      packagesToRecord.push({ requestId: pkg.requestId, memberLocalIds: memberIds });
    }
  }

  if (orderedMembers.length === 0) {
    return { error: "No valid members selected" };
  }

  const eventExhibitor = requests[0]!.eventExhibitor;
  const companyName = eventExhibitor.exhibitor.companyName;
  const eventTitle = eventExhibitor.event.title;
  const travelDateLabel = formatDate(requests[0]!.travelDate.toISOString(), "MMM d, yyyy");
  const attachments: { name: string; content: string; contentType: string }[] = [];

  for (let i = 0; i < orderedMembers.length; i++) {
    const member = orderedMembers[i]!;
    const docs = await prisma.exhibitorMemberDocument.findMany({
      where: {
        eventExhibitorId: parsed.data.eventExhibitorId,
        memberLocalId: member.id,
      },
    });
    if (!docs.some((d) => d.documentType === "PASSPORT")) {
      return { error: `Missing passport document for ${member.fn} ${member.ln}` };
    }

    const { fileName, bytes } = await buildMemberDocumentsPdf({
      member,
      passportNumber: member.passportNumber?.trim() || "—",
      fileIndex: i + 1,
      documents: docs.map((d) => ({
        documentType: d.documentType as MemberDocumentType,
        cloudinaryPublicId: d.cloudinaryPublicId,
        mimeType: d.mimeType,
        originalFileName: d.originalFileName,
      })),
    });

    attachments.push({
      name: fileName,
      content: Buffer.from(bytes).toString("base64"),
      contentType: "application/pdf",
    });
  }

  const emailResult = await sendFlightBookingPackageEmail({
    to: parsed.data.recipientEmail,
    cc: process.env.FLIGHT_BOOKING_CC_EMAIL || process.env.POSTMARK_SENDER_EMAIL || undefined,
    companyName,
    eventTitle,
    travelDate: travelDateLabel,
    ticketCount: orderedMembers.length,
    members: orderedMembers.map((m) => ({
      name: `${m.fn} ${m.ln}`,
      email: m.email,
      phone: m.phone,
      passportNumber: m.passportNumber?.trim() || "—",
    })),
    message: parsed.data.message,
    attachments,
  });

  if (!emailResult.success) {
    return { error: emailResult.error ?? "Failed to send email" };
  }

  await prisma.$transaction(async (tx) => {
    for (const pkg of packagesToRecord) {
      await tx.airBookingDispatch.create({
        data: {
          airBookingRequestId: pkg.requestId,
          sentById: user.id,
          recipientEmail: parsed.data.recipientEmail,
          memberLocalIds: pkg.memberLocalIds,
          postmarkMessageId: emailResult.id,
          message: parsed.data.message?.trim() || null,
        },
      });
      await tx.airBookingRequest.update({
        where: { id: pkg.requestId },
        data: { status: "SENT" },
      });
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "AirBookingDispatch",
    details: {
      eventExhibitorId: parsed.data.eventExhibitorId,
      recipientEmail: parsed.data.recipientEmail,
      memberCount: orderedMembers.length,
      requestIds: packagesToRecord.map((p) => p.requestId),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return { success: true, travellerCount: orderedMembers.length };
}

function serializeRequest(
  request: {
    id: string;
    eventExhibitorId: string;
    ticketCount: number;
    travelDate: Date;
    notes: string | null;
    memberLocalIds: string[];
    status: SerializedAirBookingRequest["status"];
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
