"use client";

import { useMemo } from "react";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import { Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { BadgePhotoUpload } from "@/components/exhibitor-portal/badge-photo-upload";
import { Button } from "@/components/ui/Button";
import { Download, IdCard } from "lucide-react";
import { notify } from "@/lib/notify";

type Props = {
  eventExhibitorId: string;
  eventTitle: string;
  members: TeamMember[];
  memberDocuments: SerializedMemberDocument[];
  onDocumentUploaded: (document: SerializedMemberDocument) => void;
};

export function ExhibitorMemberBadgesPanel({
  eventExhibitorId,
  eventTitle,
  members,
  memberDocuments,
  onDocumentUploaded,
}: Props) {
  const photoByMember = useMemo(() => {
    const map = new Map<string, SerializedMemberDocument>();
    for (const doc of memberDocuments) {
      if (doc.documentType === "BADGE_PHOTO") {
        map.set(doc.memberLocalId, doc);
      }
    }
    return map;
  }, [memberDocuments]);

  const readyCount = members.filter((m) => photoByMember.has(m.id)).length;

  const downloadMemberBadge = (memberId: string, memberName: string) => {
    if (!photoByMember.has(memberId)) {
      notify.error("Upload a badge photo first");
      return;
    }
    window.location.href = `/api/exhibitor/badges/${encodeURIComponent(eventExhibitorId)}/${encodeURIComponent(memberId)}`;
    notify.success(`Downloading badge for ${memberName}`);
  };

  const downloadAllBadges = () => {
    if (readyCount === 0) {
      notify.error("Upload badge photos before downloading");
      return;
    }
    window.location.href = `/api/exhibitor/badges/${encodeURIComponent(eventExhibitorId)}/bulk`;
    notify.success("Preparing badge ZIP…");
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <Panel
      title="Exhibitor badges (A7)"
      icon={IdCard}
      action={
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={readyCount === 0}
          onClick={downloadAllBadges}
        >
          <Download className="h-4 w-4" />
          Download all ({readyCount})
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate print-ready <strong>A7 (74 × 105 mm)</strong> badges with photo and QR code for{" "}
          <strong>{eventTitle}</strong>. Upload a headshot for each team member, then download individual PDFs or a ZIP for your badge printer.
        </p>

        <div className="space-y-3">
          {members.map((member) => {
            const fullName = `${member.fn} ${member.ln}`.trim();
            const hasPhoto = photoByMember.has(member.id);
            return (
              <div
                key={member.id}
                className="rounded-xl border border-border/70 bg-card/50 p-3 sm:p-4"
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 gap-1.5 sm:w-auto"
                    disabled={!hasPhoto}
                    onClick={() => downloadMemberBadge(member.id, fullName)}
                  >
                    <Download className="h-4 w-4" />
                    Download A7 PDF
                  </Button>
                </div>
                <BadgePhotoUpload
                  eventExhibitorId={eventExhibitorId}
                  memberLocalId={member.id}
                  memberName={fullName}
                  documents={memberDocuments}
                  onUploaded={onDocumentUploaded}
                  compact
                />
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
