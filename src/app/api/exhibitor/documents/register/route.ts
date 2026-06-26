import { NextResponse } from "next/server";
import type { MemberDocumentType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/lib/member-document-types";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const DOCUMENT_TYPES = new Set<MemberDocumentType>([
  "PASSPORT",
  "VISA",
  "NATIONAL_ID",
  "YELLOW_FEVER",
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
    const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "");
    const originalFileName = String(body.originalFileName ?? "");
    const mimeType = String(body.mimeType ?? "");
    const fileSize = Number(body.fileSize ?? 0);

    if (!eventExhibitorId || !memberLocalId || !DOCUMENT_TYPES.has(documentType)) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }
    if (!cloudinaryPublicId || !originalFileName) {
      return NextResponse.json({ error: "Missing Cloudinary upload details" }, { status: 400 });
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Only PDF, JPG, or PNG files are allowed" }, { status: 400 });
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "File must be 10 MB or smaller" }, { status: 400 });
    }

    const access = await assertExhibitorEventAccess(user, eventExhibitorId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const document = await prisma.exhibitorMemberDocument.upsert({
      where: {
        eventExhibitorId_memberLocalId_documentType: {
          eventExhibitorId,
          memberLocalId,
          documentType,
        },
      },
      create: {
        eventExhibitorId,
        memberLocalId,
        documentType,
        cloudinaryPublicId,
        originalFileName,
        mimeType,
        fileSize,
        uploadedById: user.id,
      },
      update: {
        cloudinaryPublicId,
        originalFileName,
        mimeType,
        fileSize,
        uploadedById: user.id,
      },
    });

    try {
      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entity: "ExhibitorMemberDocument",
        entityId: document.id,
        details: { eventExhibitorId, memberLocalId, documentType },
      });
    } catch (auditError) {
      console.error("Document audit log failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        eventExhibitorId: document.eventExhibitorId,
        memberLocalId: document.memberLocalId,
        documentType: document.documentType,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        uploadedAt: document.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Document register failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
