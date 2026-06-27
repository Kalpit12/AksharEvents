"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { sendFlightBookingRateEmail } from "@/lib/email";
import {
  canSendMemberToTravelAgent,
  serializeWorkflow,
  type SerializedAirBookingMemberWorkflow,
} from "@/lib/air-booking-workflow-types";
import { requireExhibitorAccess } from "@/lib/exhibitor";
import { prisma, withDbRetry } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const sendRateSchema = z.object({
  eventExhibitorId: z.string().min(1),
  travellers: z
    .array(
      z.object({
        memberLocalId: z.string().min(1),
        travelDate: z.string().min(1),
      })
    )
    .min(1),
  rateAmount: z.number().positive(),
  rateCurrency: z.string().min(1).max(8).default("KES"),
  rateDetails: z.string().max(4000).optional(),
});

async function memberWasDispatchedInDb(eventExhibitorId: string, memberLocalId: string) {
  const dispatches = await prisma.airBookingDispatch.findMany({
    where: {
      airBookingRequest: { eventExhibitorId },
      memberLocalIds: { has: memberLocalId },
    },
    take: 1,
  });
  return dispatches.length > 0;
}

async function ensureWorkflowReadyForRate(
  eventExhibitorId: string,
  memberLocalId: string,
  dispatched: boolean
) {
  let workflow = await prisma.airBookingMemberWorkflow.findUnique({
    where: {
      eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
    },
  });

  if (!workflow) {
    if (!dispatched) return { error: "No verification record found for this traveller" as const };
    workflow = await prisma.airBookingMemberWorkflow.create({
      data: {
        eventExhibitorId,
        memberLocalId,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
    return { workflow };
  }

  if (workflow.status === "RATE_SENT" || workflow.status === "PAID") {
    return { error: "Rate has already been sent for this traveller" as const };
  }

  if (workflow.status === "VERIFICATION_PENDING" && dispatched) {
    workflow = await prisma.airBookingMemberWorkflow.update({
      where: { id: workflow.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });
    return { workflow };
  }

  if (workflow.status !== "VERIFIED") {
    return { error: "Traveller must be verified before sending a rate" as const };
  }

  return { workflow };
}

export async function listAirBookingMemberWorkflowsForEvent(
  eventId: string
): Promise<SerializedAirBookingMemberWorkflow[]> {
  const user = await requireRole("ADMIN");
  if (!user) return [];

  const rows = await prisma.airBookingMemberWorkflow.findMany({
    where: { eventExhibitor: { eventId } },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(serializeWorkflow);
}

export async function listAirBookingMemberWorkflowsForExhibitor(eventExhibitorId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  if (user.role !== "ADMIN") {
    const access = await requireExhibitorAccess(user.id);
    if (!access) return { error: "Access denied" };
    const entry = await prisma.eventExhibitor.findFirst({
      where: { id: eventExhibitorId, exhibitorId: access.exhibitor.id },
    });
    if (!entry) return { error: "Access denied" };
  }

  const rows = await prisma.airBookingMemberWorkflow.findMany({
    where: { eventExhibitorId },
    orderBy: { updatedAt: "desc" },
  });

  return { success: true, workflows: rows.map(serializeWorkflow) };
}

export async function ensureMemberVerificationPending(
  eventExhibitorId: string,
  memberLocalId: string
) {
  await prisma.airBookingMemberWorkflow.upsert({
    where: {
      eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
    },
    create: {
      eventExhibitorId,
      memberLocalId,
      status: "VERIFICATION_PENDING",
    },
    update: {},
  });
}

export async function verifyAirBookingMember(
  eventExhibitorId: string,
  memberLocalId: string
) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const workflow = await prisma.airBookingMemberWorkflow.findUnique({
    where: {
      eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
    },
  });
  if (!workflow) {
    await ensureMemberVerificationPending(eventExhibitorId, memberLocalId);
    const created = await prisma.airBookingMemberWorkflow.findUnique({
      where: {
        eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
      },
    });
    if (!created || created.status !== "VERIFICATION_PENDING") {
      return { error: "Traveller is not awaiting verification" };
    }
  } else if (workflow.status !== "VERIFICATION_PENDING") {
    return { error: "Traveller is not awaiting verification" };
  }

  const workflowId =
    workflow?.id ??
    (
      await prisma.airBookingMemberWorkflow.findUniqueOrThrow({
        where: {
          eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
        },
      })
    ).id;

  const updated = await withDbRetry(() =>
    prisma.airBookingMemberWorkflow.update({
      where: { id: workflowId },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    })
  );

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "AirBookingMemberWorkflow",
    entityId: updated.id,
    details: { status: "VERIFIED", memberLocalId },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return { success: true, workflow: serializeWorkflow(updated) };
}

export async function sendAirBookingRateToExhibitor(input: z.infer<typeof sendRateSchema>) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const parsed = sendRateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const entry = await prisma.eventExhibitor.findUnique({
    where: { id: parsed.data.eventExhibitorId },
    include: {
      exhibitor: true,
      event: { select: { title: true } },
      registration: true,
    },
  });
  if (!entry) return { error: "Exhibitor registration not found" };

  const contactEmail = entry.exhibitor.contactEmail?.trim();
  if (!contactEmail) {
    return { error: "Exhibitor account has no contact email on file" };
  }

  const members =
    entry.registration?.formData &&
    typeof entry.registration.formData === "object" &&
    Array.isArray((entry.registration.formData as { members?: unknown }).members)
      ? ((entry.registration.formData as {
          members: { id: string; fn: string; ln: string; email?: string }[];
        }).members)
      : [];

  const readyWorkflows: { id: string; memberLocalId: string }[] = [];
  const emailTravellers: { name: string; email: string; travelDate: string }[] = [];

  for (const traveller of parsed.data.travellers) {
    const dispatched = await memberWasDispatchedInDb(
      parsed.data.eventExhibitorId,
      traveller.memberLocalId
    );
    const workflowResult = await ensureWorkflowReadyForRate(
      parsed.data.eventExhibitorId,
      traveller.memberLocalId,
      dispatched
    );
    if ("error" in workflowResult) {
      return { error: `${workflowResult.error} (${traveller.memberLocalId})` };
    }

    const member = members.find((m) => m.id === traveller.memberLocalId);
    const travellerName = member ? `${member.fn} ${member.ln}` : "Traveller";
    const travelDate = new Date(traveller.travelDate);
    const travelDateLabel = Number.isNaN(travelDate.getTime())
      ? traveller.travelDate
      : formatDate(travelDate.toISOString(), "MMM d, yyyy");

    readyWorkflows.push({
      id: workflowResult.workflow.id,
      memberLocalId: traveller.memberLocalId,
    });
    emailTravellers.push({
      name: travellerName,
      email: member?.email?.trim() || "—",
      travelDate: travelDateLabel,
    });
  }

  const emailResult = await sendFlightBookingRateEmail({
    to: contactEmail,
    companyName: entry.exhibitor.companyName,
    eventTitle: entry.event.title,
    travellers: emailTravellers,
    rateAmountPerPerson: parsed.data.rateAmount,
    rateCurrency: parsed.data.rateCurrency,
    rateDetails: parsed.data.rateDetails,
  });

  if (!emailResult.success) {
    return { error: emailResult.error ?? "Failed to send rate email" };
  }

  const rateDetails = parsed.data.rateDetails?.trim() || null;
  const updatedWorkflows = await withDbRetry(() =>
    prisma.$transaction(
      readyWorkflows.map((workflow) =>
        prisma.airBookingMemberWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "RATE_SENT",
            rateAmount: parsed.data.rateAmount,
            rateCurrency: parsed.data.rateCurrency,
            rateDetails,
            rateSentAt: new Date(),
          },
        })
      )
    )
  );

  for (const updated of updatedWorkflows) {
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "AirBookingMemberWorkflow",
      entityId: updated.id,
      details: {
        status: "RATE_SENT",
        memberLocalId: updated.memberLocalId,
        recipientEmail: contactEmail,
        rateAmount: parsed.data.rateAmount,
        travellerCount: parsed.data.travellers.length,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return {
    success: true,
    workflows: updatedWorkflows.map(serializeWorkflow),
    travellerCount: parsed.data.travellers.length,
  };
}

export async function markAirBookingMemberPaid(
  eventExhibitorId: string,
  memberLocalId: string
) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const workflow = await prisma.airBookingMemberWorkflow.findUnique({
    where: {
      eventExhibitorId_memberLocalId: { eventExhibitorId, memberLocalId },
    },
  });
  if (!workflow) return { error: "No workflow record found for this traveller" };
  if (workflow.status !== "RATE_SENT") {
    return { error: "Rate must be sent before marking as paid" };
  }

  const updated = await withDbRetry(() =>
    prisma.airBookingMemberWorkflow.update({
      where: { id: workflow.id },
      data: { status: "PAID", paidAt: new Date() },
    })
  );

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "AirBookingMemberWorkflow",
    entityId: updated.id,
    details: { status: "PAID", memberLocalId },
  });

  revalidatePath("/admin");
  revalidatePath("/exhibitor");

  return { success: true, workflow: serializeWorkflow(updated) };
}
