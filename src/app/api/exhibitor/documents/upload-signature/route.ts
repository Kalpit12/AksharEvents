import { NextResponse } from "next/server";
import type { MemberDocumentType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { createAuthenticatedUploadSignature } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";

const DOCUMENT_TYPES = new Set<MemberDocumentType>([
  "PASSPORT",
  "VISA",
  "NATIONAL_ID",
  "YELLOW_FEVER",
  "BADGE_PHOTO",
  "OTHER",
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventExhibitorId = String(body.eventExhibitorId ?? "");
    const memberLocalId = String(body.memberLocalId ?? "");
    const documentType = String(body.documentType ?? "") as MemberDocumentType;

    if (!eventExhibitorId || !memberLocalId || !DOCUMENT_TYPES.has(documentType)) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }

    const access = await assertExhibitorEventAccess(user, eventExhibitorId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const signature = createAuthenticatedUploadSignature({ eventExhibitorId, memberLocalId });

    return NextResponse.json({ success: true, ...signature });
  } catch (error) {
    console.error("Upload signature failed:", error);
    const message = error instanceof Error ? error.message : "Could not prepare upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
