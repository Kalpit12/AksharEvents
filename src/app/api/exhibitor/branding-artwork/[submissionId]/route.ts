import { getCurrentUser } from "@/lib/auth";
import { getAuthenticatedDocumentUrl } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { isPrintingStaffRole } from "@/lib/printing-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { submissionId } = await context.params;
  const submission = await prisma.brandingArtworkSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission?.cloudinaryPublicId) {
    return new Response("Not found", { status: 404 });
  }

  if (!user.role || !isPrintingStaffRole(user.role)) {
    const access = await assertExhibitorEventAccess(user, submission.eventExhibitorId);
    if (!access.ok) {
      return new Response(access.error, { status: access.status });
    }
  }

  const resourceType =
    submission.mimeType === "application/pdf" ||
    submission.mimeType === "application/postscript" ||
    submission.mimeType === "application/illustrator"
      ? "raw"
      : "image";
  const url = getAuthenticatedDocumentUrl(submission.cloudinaryPublicId, resourceType);
  return Response.redirect(url, 302);
}
