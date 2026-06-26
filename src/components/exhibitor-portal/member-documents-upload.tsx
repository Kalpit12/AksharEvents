"use client";

import { useRef, useState } from "react";
import type { MemberDocumentType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { MEMBER_DOCUMENT_LABELS, ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_BYTES, type SerializedMemberDocument } from "@/lib/member-document-types";
import { cn } from "@/lib/utils";
import { Check, FileUp, Loader2 } from "lucide-react";
import { notify } from "@/lib/notify";

const UPLOAD_TYPES: MemberDocumentType[] = ["PASSPORT", "VISA", "NATIONAL_ID", "YELLOW_FEVER"];

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
};

export function MemberDocumentsUpload({
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
  const [uploading, setUploading] = useState<MemberDocumentType | null>(null);
  const inputRefs = useRef<Partial<Record<MemberDocumentType, HTMLInputElement | null>>>({});

  const docsForMember = documents.filter((d) => d.memberLocalId === memberLocalId);

  const upload = async (documentType: MemberDocumentType, file: File) => {
    if (file.size > MAX_DOCUMENT_BYTES) {
      notify.error("File must be 10 MB or smaller");
      return;
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
      notify.error("Only PDF, JPG, or PNG files are allowed");
      return;
    }

    setUploading(documentType);
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

      const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: cloudForm,
      });
      const cloudResult = await cloudResponse.json();
      if (!cloudResponse.ok || cloudResult.error) {
        notify.error(cloudResult.error?.message ?? "Cloudinary upload failed");
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
      notify.success(`${MEMBER_DOCUMENT_LABELS[documentType]} uploaded`);
    } catch {
      notify.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className={cn("space-y-2", compact ? "" : "rounded-xl border border-border/60 bg-muted/20 p-3")}>
      {!compact && (
        <p className="text-xs font-medium text-muted-foreground">
          Official documents for {memberName} (stored securely — not publicly accessible)
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {UPLOAD_TYPES.map((type) => {
          const existing = docsForMember.find((d) => d.documentType === type);
          const isUploading = uploading === type;
          return (
            <div key={type} className="rounded-lg border border-dashed border-border bg-card/80 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{MEMBER_DOCUMENT_LABELS[type]}</p>
                  {existing ? (
                    <p className="mt-0.5 truncate text-[11px] text-emerald-700 dark:text-emerald-400">
                      <Check className="mr-1 inline h-3 w-3" />
                      {existing.originalFileName}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">PDF, JPG, or PNG · max 10 MB</p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 gap-1 text-xs"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[type]?.click()}
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                  {existing ? "Replace" : "Upload"}
                </Button>
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[type] = el;
                }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(type, file);
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
