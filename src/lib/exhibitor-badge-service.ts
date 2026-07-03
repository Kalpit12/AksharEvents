import { prisma } from "@/lib/prisma";
import { fetchAuthenticatedDocumentBuffer } from "@/lib/cloudinary-server";
import { generateQRCodeDataUrl, getExhibitorBadgeQRPayload } from "@/lib/qr";
import { buildExhibitorBadgePdf } from "@/lib/exhibitor-badge-asset";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import "server-only";

type SavedRegistration = {
  members?: TeamMember[];
  company?: string;
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

export async function buildMemberExhibitorBadgePdf(
  eventExhibitorId: string,
  memberLocalId: string
) {
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
    return { error: "Event exhibitor link not found" as const };
  }

  const registration = eventExhibitor.registration?.formData as SavedRegistration | undefined;
  const member = registration?.members?.find((m) => m.id === memberLocalId);
  if (!member) {
    return { error: "Team member not found in registration" as const };
  }

  const photoDoc = await loadExhibitorBadgePhoto(eventExhibitorId, memberLocalId);
  if (!photoDoc) {
    return { error: "Upload a badge photo before downloading" as const };
  }

  const photoBuffer = await fetchAuthenticatedDocumentBuffer(photoDoc.cloudinaryPublicId, "image");

  const companyName =
    registration?.company?.trim() ||
    eventExhibitor.exhibitor.companyName ||
    "Exhibitor";

  const boothLabel = eventExhibitor.boothNumber?.trim() || null;

  const qrDataUrl = await generateQRCodeDataUrl(
    getExhibitorBadgeQRPayload(memberLocalId, eventExhibitorId, eventExhibitor.event.id)
  );

  const pdfBytes = await buildExhibitorBadgePdf({
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
  });

  const safeName = `${member.fn}-${member.ln}`.replace(/[^\w.-]+/g, "_");

  return {
    pdfBytes,
    fileName: `exhibitor-badge-${safeName}.pdf`,
    memberName: `${member.fn} ${member.ln}`.trim(),
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
