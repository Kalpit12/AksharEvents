"use client";

import { useRef, useState } from "react";
import type { MemberDocumentType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { MEMBER_DOCUMENT_LABELS, type SerializedMemberDocument } from "@/lib/member-document-types";
import { cn } from "@/lib/utils";
import { Check, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const UPLOAD_TYPES: MemberDocumentType[] = ["PASSPORT", "VISA", "NATIONAL_ID", "YELLOW_FEVER"];

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
    setUploading(documentType);
    try {
      const body = new FormData();
      body.set("eventExhibitorId", eventExhibitorId);
      body.set("memberLocalId", memberLocalId);
      body.set("documentType", documentType);
      body.set("file", file);

      const response = await fetch("/api/exhibitor/documents/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Upload failed");
        return;
      }
      onUploaded(result.document);
      toast.success(`${MEMBER_DOCUMENT_LABELS[documentType]} uploaded for ${memberName}`);
    } catch {
      toast.error("Upload failed");
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
