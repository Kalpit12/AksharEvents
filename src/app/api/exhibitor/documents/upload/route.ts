import { NextResponse } from "next/server";
import type { MemberDocumentType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { uploadAuthenticatedDocument } from "@/lib/cloudinary-server";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/lib/member-document-types";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOCUMENT_TYPES = new Set<MemberDocumentType>([
  "PASSPORT",
  "VISA",
  "NATIONAL_ID",
  "YELLOW_FEVER",
  "OTHER",
]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const eventExhibitorId = String(formData.get("eventExhibitorId") ?? "");
    const memberLocalId = String(formData.get("memberLocalId") ?? "");
    const documentType = String(formData.get("documentType") ?? "") as MemberDocumentType;
    const file = formData.get("file");

    if (!eventExhibitorId || !memberLocalId || !DOCUMENT_TYPES.has(documentType)) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG, or WEBP files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "File must be 10 MB or smaller" }, { status: 400 });
    }

    const access = await assertExhibitorEventAccess(user, eventExhibitorId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadAuthenticatedDocument(buffer, {
      eventExhibitorId,
      memberLocalId,
      originalFileName: file.name,
      mimeType: file.type,
    });

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
        cloudinaryPublicId: uploaded.publicId,
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: uploaded.bytes,
        uploadedById: user.id,
      },
      update: {
        cloudinaryPublicId: uploaded.publicId,
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: uploaded.bytes,
        uploadedById: user.id,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "ExhibitorMemberDocument",
      entityId: document.id,
      details: { eventExhibitorId, memberLocalId, documentType },
    }).catch((auditError) => console.error("Document audit log failed:", auditError));

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
    console.error("Document upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
