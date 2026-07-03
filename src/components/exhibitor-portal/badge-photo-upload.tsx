"use client";

import { useRef, useState } from "react";
import type { MemberDocumentType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import {
  BADGE_PHOTO_MIME_TYPES,
  MAX_BADGE_PHOTO_BYTES,
  MEMBER_DOCUMENT_LABELS,
  type SerializedMemberDocument,
} from "@/lib/member-document-types";
import { cn } from "@/lib/utils";
import { Camera, Check, Loader2, Upload } from "lucide-react";
import { notify } from "@/lib/notify";

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
};

export function BadgePhotoUpload({
  eventExhibitorId,
  memberLocalId,
  memberName,
  documents,
  onUploaded,
  compact = false,
}: {
  eventExhibitorId: string;
  memberLocalId: string;
  memberName: string;
  documents: SerializedMemberDocument[];
  onUploaded: (document: SerializedMemberDocument) => void;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const documentType: MemberDocumentType = "BADGE_PHOTO";
  const existing = documents.find(
    (d) => d.memberLocalId === memberLocalId && d.documentType === documentType
  );

  const upload = async (file: File) => {
    if (file.size > MAX_BADGE_PHOTO_BYTES) {
      notify.error("Badge photo must be 2 MB or smaller");
      return;
    }
    if (!BADGE_PHOTO_MIME_TYPES.has(file.type)) {
      notify.error("Use JPG, PNG, or WEBP for badge photos");
      return;
    }

    setUploading(true);
    try {
      const signResponse = await fetch("/api/exhibitor/documents/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventExhibitorId, memberLocalId, documentType }),
      });
      const signResult = await signResponse.json();
      if (!signResponse.ok) {
        notify.error(signResult.error ?? "Could not prepare upload");
        return;
      }

      const { cloudName, apiKey, signature, timestamp, folder } = signResult as UploadSignature;
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", String(timestamp));
      cloudForm.append("signature", signature);
      cloudForm.append("folder", folder);
      cloudForm.append("type", "authenticated");

      const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: cloudForm,
      });
      const cloudResult = await cloudResponse.json();
      if (!cloudResponse.ok || cloudResult.error) {
        notify.error(cloudResult.error?.message ?? "Photo upload failed");
        return;
      }

      const registerResponse = await fetch("/api/exhibitor/documents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventExhibitorId,
          memberLocalId,
          documentType,
          cloudinaryPublicId: cloudResult.public_id,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: cloudResult.bytes,
        }),
      });
      const registerResult = await registerResponse.json();
      if (!registerResponse.ok) {
        notify.error(registerResult.error ?? "Upload failed");
        return;
      }

      onUploaded(registerResult.document);
      notify.success("Badge photo uploaded");
    } catch {
      notify.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-card/80 p-2.5", compact && "p-2")}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {existing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/exhibitor/documents/${existing.id}`}
              alt={`${memberName} badge photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">{MEMBER_DOCUMENT_LABELS.BADGE_PHOTO}</p>
          {existing ? (
            <p className="mt-0.5 truncate text-[11px] text-emerald-700 dark:text-emerald-400">
              <Check className="mr-1 inline h-3 w-3" />
              {existing.originalFileName}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Face visible · plain background · JPG/PNG · max 2 MB
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {existing ? "Replace" : "Upload"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
