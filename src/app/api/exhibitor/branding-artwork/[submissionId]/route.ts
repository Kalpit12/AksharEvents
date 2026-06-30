import { getCurrentUser } from "@/lib/auth";
import {
  getAuthenticatedBrandingArtworkUrl,
  resolveBrandingArtworkResourceType,
} from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { isPrintingStaffRole } from "@/lib/printing-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
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

  const download = new URL(request.url).searchParams.get("download") === "1";
  const resourceType = await resolveBrandingArtworkResourceType(
    submission.cloudinaryPublicId,
    submission.cloudinaryResourceType,
    submission.mimeType
  );

  const url = getAuthenticatedBrandingArtworkUrl(submission.cloudinaryPublicId, {
    resourceType,
    download,
    fileName: submission.originalFileName ?? undefined,
  });

  return Response.redirect(url, 302);
}
