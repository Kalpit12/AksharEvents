import { getCurrentUser } from "@/lib/auth";
import { getAuthenticatedDocumentUrl } from "@/lib/cloudinary-server";
import { prisma } from "@/lib/prisma";

async function canAccessDocument(user: { id: string; role: string }, eventExhibitorId: string) {
  if (user.role === "ADMIN") return true;
  const entry = await prisma.eventExhibitor.findFirst({
    where: {
      id: eventExhibitorId,
      exhibitor: {
        OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
  });
  return Boolean(entry);
}

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

  const allowed = await canAccessDocument(user, document.eventExhibitorId);
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const resourceType = document.mimeType === "application/pdf" ? "raw" : "image";
  const url = getAuthenticatedDocumentUrl(document.cloudinaryPublicId, resourceType);
  return Response.redirect(url, 302);
}
