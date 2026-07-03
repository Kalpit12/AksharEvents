import { prisma } from "@/lib/prisma";
import { fetchAuthenticatedDocumentBuffer } from "@/lib/cloudinary-server";
import { generateQRCodeDataUrl, getExhibitorBadgeQRPayload } from "@/lib/qr";
import {
  buildExhibitorBadgePdf,
  buildExhibitorBadgesA4SheetPdf,
  type ExhibitorBadgeAssetInput,
} from "@/lib/exhibitor-badge-asset";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import "server-only";

type SavedRegistration = {
  members?: TeamMember[];
  form?: { company?: string };
};

export async function loadExhibitorBadgePhoto(eventExhibitorId: string, memberLocalId: string) {
  return prisma.exhibitorMemberDocument.findUnique({
    where: {
      eventExhibitorId_memberLocalId_documentType: {
        eventExhibitorId,
        memberLocalId,
        documentType: "BADGE_PHOTO",
      },
    },
  });
}

async function resolveMemberBadgeInput(
  eventExhibitorId: string,
  memberLocalId: string
): Promise<ExhibitorBadgeAssetInput | { error: string }> {
  const eventExhibitor = await prisma.eventExhibitor.findUnique({
    where: { id: eventExhibitorId },
    include: {
      exhibitor: { select: { companyName: true } },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
      registration: { select: { formData: true } },
    },
  });

  if (!eventExhibitor) {
    return { error: "Event exhibitor link not found" };
  }

  const registration = eventExhibitor.registration?.formData as SavedRegistration | undefined;
  const member = registration?.members?.find((m) => m.id === memberLocalId);
  if (!member) {
    return { error: "Team member not found in registration" };
  }

  const photoDoc = await loadExhibitorBadgePhoto(eventExhibitorId, memberLocalId);
  if (!photoDoc) {
    return { error: "Upload a badge photo before downloading" };
  }

  const photoBuffer = await fetchAuthenticatedDocumentBuffer(photoDoc.cloudinaryPublicId, "image");

  const companyName =
    registration?.form?.company?.trim() ||
    eventExhibitor.exhibitor.companyName ||
    "Exhibitor";

  const boothLabel = eventExhibitor.boothNumber?.trim() || null;

  const qrDataUrl = await generateQRCodeDataUrl(
    getExhibitorBadgeQRPayload(memberLocalId, eventExhibitorId, eventExhibitor.event.id)
  );

  return {
    memberName: `${member.fn} ${member.ln}`.trim(),
    memberRole: member.role,
    companyName,
    boothLabel,
    eventTitle: eventExhibitor.event.title,
    startDate: eventExhibitor.event.startDate,
    endDate: eventExhibitor.event.endDate,
    memberLocalId,
    qrDataUrl,
    photoBuffer,
  };
}

export async function buildMemberExhibitorBadgePdf(
  eventExhibitorId: string,
  memberLocalId: string
) {
  const input = await resolveMemberBadgeInput(eventExhibitorId, memberLocalId);
  if ("error" in input) {
    return { error: input.error };
  }

  const pdfBytes = await buildExhibitorBadgePdf(input);
  const safeName = input.memberName.replace(/\s+/g, "-").replace(/[^\w.-]+/g, "_");

  return {
    pdfBytes,
    fileName: `exhibitor-badge-${safeName}.pdf`,
    memberName: input.memberName,
  };
}

export async function buildAllMemberExhibitorBadgesA4Pdf(eventExhibitorId: string) {
  const roster = await listMembersWithBadgePhotos(eventExhibitorId);
  const ready = roster.filter((row) => row.hasBadgePhoto);
  if (ready.length === 0) {
    return { error: "Upload badge photos for at least one team member first" as const };
  }

  const inputs = (
    await Promise.all(
      ready.map((row) => resolveMemberBadgeInput(eventExhibitorId, row.member.id))
    )
  ).filter((input): input is ExhibitorBadgeAssetInput => !("error" in input));

  if (inputs.length === 0) {
    return { error: "Could not build any badges" as const };
  }

  const eventExhibitor = await prisma.eventExhibitor.findUnique({
    where: { id: eventExhibitorId },
    include: { exhibitor: { select: { companyName: true } } },
  });

  const companySlug = (eventExhibitor?.exhibitor.companyName ?? "exhibitor")
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]+/g, "_");

  const pdfBytes = await buildExhibitorBadgesA4SheetPdf(inputs);

  return {
    pdfBytes,
    fileName: `exhibitor-badges-${companySlug}-a4.pdf`,
    badgeCount: inputs.length,
  };
}

export async function listMembersWithBadgePhotos(eventExhibitorId: string) {
  const [registration, photos] = await Promise.all([
    prisma.exhibitorRegistration.findUnique({
      where: { eventExhibitorId },
      select: { formData: true },
    }),
    prisma.exhibitorMemberDocument.findMany({
      where: { eventExhibitorId, documentType: "BADGE_PHOTO" },
      select: { memberLocalId: true, id: true },
    }),
  ]);

  const members = (registration?.formData as SavedRegistration | undefined)?.members ?? [];
  const photoByMember = new Map(photos.map((p) => [p.memberLocalId, p.id]));

  return members.map((member) => ({
    member,
    hasBadgePhoto: photoByMember.has(member.id),
    badgePhotoDocumentId: photoByMember.get(member.id) ?? null,
  }));
}
