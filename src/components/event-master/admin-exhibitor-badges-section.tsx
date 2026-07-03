"use client";

import { useMemo, useState } from "react";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { Button } from "@/components/ui/Button";
import { Download, IdCard, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";

type Props = {
  eventExhibitorId: string;
  eventTitle: string;
  members: TeamMember[];
  badgePhotoMemberIds: string[];
};

async function downloadBadgeFile(url: string, fallbackFileName: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const fileName = disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallbackFileName;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function AdminExhibitorBadgesSection({
  eventExhibitorId,
  eventTitle,
  members,
  badgePhotoMemberIds,
}: Props) {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingMemberId, setDownloadingMemberId] = useState<string | null>(null);

  const photoByMember = useMemo(
    () => new Set(badgePhotoMemberIds),
    [badgePhotoMemberIds]
  );

  const readyCount = members.filter((m) => photoByMember.has(m.id)).length;
  const badgeBase = `/api/exhibitor/badges/${encodeURIComponent(eventExhibitorId)}`;

  const downloadMemberBadge = async (memberId: string, memberName: string) => {
    if (!photoByMember.has(memberId)) {
      notify.error("Badge photo not uploaded for this member yet");
      return;
    }

    setDownloadingMemberId(memberId);
    try {
      await downloadBadgeFile(
        `${badgeBase}/${encodeURIComponent(memberId)}`,
        `exhibitor-badge-${memberName.replace(/\s+/g, "-")}.pdf`
      );
      notify.success(`Downloaded badge for ${memberName}`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not download badge");
    } finally {
      setDownloadingMemberId(null);
    }
  };

  const downloadAllBadges = async () => {
    if (readyCount === 0) {
      notify.error("No badge photos on file yet");
      return;
    }

    setDownloadingAll(true);
    try {
      await downloadBadgeFile(`${badgeBase}/bulk-a4`, "exhibitor-badges-a4.pdf");
      notify.success(`Downloaded A4 sheet with ${readyCount} badge${readyCount === 1 ? "" : "s"}`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not download badges");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <IdCard className="h-4 w-4 text-primary" />
          Exhibitor badges (A7)
        </h4>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={readyCount === 0 || downloadingAll}
          onClick={() => void downloadAllBadges()}
        >
          {downloadingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloadingAll ? "Preparing A4 PDF…" : `Download all (${readyCount})`}
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Print-ready <strong>A7 (74 × 105 mm)</strong> badges with photo and QR code for{" "}
        <strong>{eventTitle}</strong>. <strong>Download all</strong> produces one A4 PDF (4 badges
        per page) for office printing. Photos are uploaded by the exhibitor in their portal.
      </p>

      <div className="space-y-2">
        {members.map((member) => {
          const fullName = `${member.fn} ${member.ln}`.trim();
          const hasPhoto = photoByMember.has(member.id);
          const isDownloading = downloadingMemberId === member.id;
          return (
            <div
              key={member.id}
              className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.role}
                  {!hasPhoto && " · Photo pending"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full shrink-0 gap-1.5 sm:w-auto"
                disabled={!hasPhoto || isDownloading || downloadingAll}
                onClick={() => void downloadMemberBadge(member.id, fullName)}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Downloading…" : "Download A7 PDF"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
