import { getCurrentUser } from "@/lib/auth";
import { getAuthenticatedDocumentUrl } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { documentId } = await context.params;
  const document = await prisma.exhibitorMemberDocument.findUnique({
    where: { id: documentId },
  });
  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  const access = await assertExhibitorEventAccess(user, document.eventExhibitorId);
  if (!access.ok) {
    return new Response(access.error, { status: access.status });
  }

  const resourceType = document.mimeType === "application/pdf" ? "raw" : "image";
  const url = getAuthenticatedDocumentUrl(document.cloudinaryPublicId, resourceType);
  return Response.redirect(url, 302);
}
