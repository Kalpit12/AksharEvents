import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertExhibitorEventAccess } from "@/lib/member-document-access";
import { buildAllMemberExhibitorBadgesA4Pdf } from "@/lib/exhibitor-badge-service";

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

  const result = await buildAllMemberExhibitorBadgesA4Pdf(eventExhibitorId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return new NextResponse(Buffer.from(result.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
