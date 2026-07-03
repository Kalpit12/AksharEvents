import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import {
  buildMemberExhibitorBadgePdf,
  listMembersWithBadgePhotos,
} from "@/lib/exhibitor-badge-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventExhibitorId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventExhibitorId } = await context.params;
  const access = await assertExhibitorEventAccess(user, eventExhibitorId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const roster = await listMembersWithBadgePhotos(eventExhibitorId);
  const ready = roster.filter((row) => row.hasBadgePhoto);
  if (ready.length === 0) {
    return NextResponse.json(
      { error: "Upload badge photos for at least one team member first" },
      { status: 400 }
    );
  }

  const zip = new JSZip();

  for (const row of ready) {
    const result = await buildMemberExhibitorBadgePdf(eventExhibitorId, row.member.id);
    if ("error" in result) continue;
    zip.file(result.fileName, result.pdfBytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  return new NextResponse(Buffer.from(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="exhibitor-badges-${eventExhibitorId}.zip"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
