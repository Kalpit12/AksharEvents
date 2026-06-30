"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import type { EventItemMasterOption } from "@/lib/event-config-types";
import {
  BRANDING_ARTWORK_STATUS_BADGE,
  BRANDING_ARTWORK_STATUS_LABELS,
  canExhibitorEditArtwork,
  isArtworkLocked,
  type SerializedBrandingArtworkSubmission,
} from "@/lib/branding-artwork-types";
import { getBrandingCatalogItems, ITEM_MASTER_CATEGORY_BRANDINGS } from "@/lib/item-master-catalog";
import { submitBrandingArtwork, ensureBrandingSubmissionRows, removeBrandingArtworkItem } from "@/lib/branding-artwork-actions";
import { EmptyState, ModalShell, Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";
import { AlertTriangle, Check, ExternalLink, FileUp, Loader2, Palette, Send, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

type Props = {
  eventExhibitorId: string | null;
  catalog: EventItemMasterOption[];
  selectedBrandingItemIds: string[];
  submissions: SerializedBrandingArtworkSubmission[];
  onSubmissionsChange: (value: SetStateAction<SerializedBrandingArtworkSubmission[]>) => void;
  onRemoveBrandingItem: (itemMasterId: string) => void | Promise<void>;
};

export function BrandingsPanel({
  eventExhibitorId,
  catalog,
  selectedBrandingItemIds,
  submissions,
  onSubmissionsChange,
  onRemoveBrandingItem,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<EventItemMasterOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItemMasterOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const skipSyncRef = useRef(false);

  const brandingCatalog = useMemo(() => getBrandingCatalogItems(catalog), [catalog]);

  const displayBrandingItemIds = useMemo(() => {
    const ids = new Set(selectedBrandingItemIds);
    for (const row of submissions) ids.add(row.itemMasterId);
    return [...ids];
  }, [selectedBrandingItemIds, submissions]);

  const displayBrandingItems = useMemo(() => {
    const items: EventItemMasterOption[] = [];
    for (const id of displayBrandingItemIds) {
      const catalogItem = brandingCatalog.find((item) => item.id === id);
      if (catalogItem) {
        items.push(catalogItem);
        continue;
      }
      const row = submissions.find((s) => s.itemMasterId === id);
      if (row) {
        items.push({
          id: row.itemMasterId,
          name: row.itemName,
          category: row.itemCategory,
          unitOfMeasure: "—",
          unitCost: 0,
          currency: "KES",
          sortOrder: 0,
        });
      }
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [displayBrandingItemIds, brandingCatalog, submissions]);

  const submissionByItemId = useMemo(() => {
    const map = new Map<string, SerializedBrandingArtworkSubmission>();
    for (const row of submissions) map.set(row.itemMasterId, row);
    return map;
  }, [submissions]);

  const syncRows = useCallback(async () => {
    if (!eventExhibitorId || skipSyncRef.current) return;

    if (selectedBrandingItemIds.length === 0) {
      // Keep all submissions — rejected (NOT_VERIFIED) items must stay visible for re-upload.
      return;
    }

    const selectedSet = new Set(selectedBrandingItemIds);

    const result = await ensureBrandingSubmissionRows(
      eventExhibitorId,
      selectedBrandingItemIds
    );
    if (result.success && result.submissions) {
      onSubmissionsChange((prev) => {
        // Preserve submissions not in current selection (e.g. rejected items cleared from invoice).
        const orphans = prev.filter((s) => !selectedSet.has(s.itemMasterId));
        const merged = new Map(orphans.map((s) => [s.itemMasterId, s]));
        for (const row of result.submissions!) merged.set(row.itemMasterId, row);
        return [...merged.values()];
      });
    }
  }, [eventExhibitorId, selectedBrandingItemIds, onSubmissionsChange]);

  useEffect(() => {
    void syncRows();
  }, [syncRows]);

  const editableItems = useMemo(
    () =>
      displayBrandingItems.filter((item) => {
        const row = submissionByItemId.get(item.id);
        return !row || canExhibitorEditArtwork(row.status);
      }),
    [displayBrandingItems, submissionByItemId]
  );

  const canSubmitItem = (itemId: string) => {
    const row = submissionByItemId.get(itemId);
    return Boolean(row && canExhibitorEditArtwork(row.status) && row.cloudinaryPublicId);
  };

  const readyToSubmitItems = useMemo(
    () =>
      editableItems.filter((item) => {
        const row = submissionByItemId.get(item.id);
        return Boolean(row && canExhibitorEditArtwork(row.status) && row.cloudinaryPublicId);
      }),
    [editableItems, submissionByItemId]
  );

  const hasSubmittedArtwork = submissions.some((row) => row.status !== "DRAFT");

  const hasRejectedArtwork = (row: SerializedBrandingArtworkSubmission | undefined) =>
    Boolean(row && (row.status === "NOT_VERIFIED" || (row.status === "DRAFT" && row.rejectionReason)));

  const uploadArtwork = async (itemMasterId: string, file: File) => {
    if (!eventExhibitorId) {
      notify.error("Link an event first");
      return;
    }

    const row = submissionByItemId.get(itemMasterId);
    if (row && isArtworkLocked(row.status)) {
      notify.error("This artwork has been submitted and cannot be changed");
      return;
    }

    setUploadingItemId(itemMasterId);
    try {
      const signResponse = await fetch("/api/exhibitor/branding-artwork/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventExhibitorId, itemMasterId }),
      });
      const signResult = await signResponse.json();
      if (!signResponse.ok) {
        notify.error(signResult.error ?? "Could not prepare upload");
        return;
      }

      const { cloudName, apiKey, signature, timestamp, folder } = signResult;
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
        notify.error(cloudResult.error?.message ?? "Upload failed");
        return;
      }

      const registerResponse = await fetch("/api/exhibitor/branding-artwork/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventExhibitorId,
          itemMasterId,
          cloudinaryPublicId: cloudResult.public_id,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: cloudResult.bytes,
        }),
      });
      const registerResult = await registerResponse.json();
      if (!registerResponse.ok) {
        notify.error(registerResult.error ?? "Could not save artwork");
        return;
      }

      onSubmissionsChange((prev) => [
        ...prev.filter((s) => s.itemMasterId !== itemMasterId),
        registerResult.submission,
      ]);
      notify.success("Artwork uploaded");
    } catch {
      notify.error("Upload failed");
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleSubmit = async (items: EventItemMasterOption[]) => {
    if (!eventExhibitorId || items.length === 0) return;
    setSubmitting(true);
    try {
      const result = await submitBrandingArtwork(
        eventExhibitorId,
        items.map((i) => i.id)
      );
      if (result.error) {
        notify.error(result.error);
        return;
      }
      if (result.submissions) {
        onSubmissionsChange((prev) => {
          const merged = new Map(prev.map((s) => [s.itemMasterId, s]));
          for (const row of result.submissions!) merged.set(row.itemMasterId, row);
          return [...merged.values()];
        });
      }
      setConfirmOpen(false);
      setSubmitTarget(null);
      const label =
        items.length === 1 ? items[0]!.name : `${items.length} branding items`;
      notify.success(`${label} submitted for review`);
    } finally {
      setSubmitting(false);
    }
  };

  const canRemoveItem = (itemId: string) => {
    const row = submissionByItemId.get(itemId);
    return !row || canExhibitorEditArtwork(row.status);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !eventExhibitorId) return;
    setDeleting(true);
    skipSyncRef.current = true;
    try {
      const result = await removeBrandingArtworkItem(eventExhibitorId, deleteTarget.id);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      await onRemoveBrandingItem(deleteTarget.id);
      onSubmissionsChange((prev) =>
        prev.filter((s) => s.itemMasterId !== deleteTarget.id)
      );
      setDeleteTarget(null);
      notify.success("Branding item removed");
    } finally {
      skipSyncRef.current = false;
      setDeleting(false);
    }
  };

  if (!eventExhibitorId) {
    return (
      <Panel title="Brandings" icon={Palette}>
        <p className="text-sm text-muted-foreground">Register for an event to upload branding artwork.</p>
      </Panel>
    );
  }

  if (displayBrandingItems.length === 0) {
    return (
      <Panel title="Brandings" icon={Palette}>
        <EmptyState
          icon={Palette}
          title="No branding items selected"
          description={`Choose items from the ${ITEM_MASTER_CATEGORY_BRANDINGS} category under Additional requirements, then return here to upload your artwork files.`}
          compact
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Branding artwork" icon={Palette}>
        <p className="mb-4 text-sm text-muted-foreground">
          {hasSubmittedArtwork
            ? "Upload and submit each branding item separately. If the printing team marks artwork as not verified, their feedback is shown below — upload a corrected file and submit that item again."
            : "Upload print-ready artwork for each branding item you selected, then submit each item when it is ready. Once submitted, files cannot be changed unless the printing team marks them as not verified."}
        </p>

        <div className="space-y-3">
          {displayBrandingItems.map((item) => {
            const row = submissionByItemId.get(item.id);
            const locked = row ? isArtworkLocked(row.status) : false;
            const editable = !row || canExhibitorEditArtwork(row.status);
            const isUploading = uploadingItemId === item.id;

            return (
              <section
                key={item.id}
                className="rounded-xl border border-border bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.unitOfMeasure} · {formatCurrency(item.unitCost, item.currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {row ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          BRANDING_ARTWORK_STATUS_BADGE[row.status]
                        )}
                      >
                        {BRANDING_ARTWORK_STATUS_LABELS[row.status]}
                      </span>
                    ) : null}
                    {canRemoveItem(item.id) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                {hasRejectedArtwork(row) ? (
                  <div
                    className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3.5 dark:border-red-800 dark:bg-red-950/40"
                    role="alert"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                          Artwork not verified — action required
                        </p>
                        {row!.rejectionReason ? (
                          <div className="rounded-md border border-red-200 bg-white px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/60">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-red-700/80 dark:text-red-300/80">
                              Issue to fix
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-red-950 dark:text-red-50">
                              {row!.rejectionReason}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-red-800 dark:text-red-200">
                            The printing team could not verify this file. Upload a corrected version
                            and submit again.
                          </p>
                        )}
                        <p className="text-xs leading-relaxed text-red-800/90 dark:text-red-200/90">
                          Upload a corrected file for <strong>{item.name}</strong> below, then
                          click <strong>Submit</strong> to send it back for review.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 rounded-lg border border-dashed border-border bg-card/80 p-3">
                  {row?.originalFileName ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs">
                        {hasRejectedArtwork(row) ? (
                          <>
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-800 dark:text-red-200">
                              Previous file (needs correction): {row.originalFileName}
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                            {row.originalFileName}
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" asChild>
                          <a
                            href={`/api/exhibitor/branding-artwork/${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </a>
                        </Button>
                        {editable ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            disabled={isUploading}
                            onClick={() => inputRefs.current[item.id]?.click()}
                          >
                            {isUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FileUp className="h-3.5 w-3.5" />
                            )}
                            {row.status === "NOT_VERIFIED" || row.rejectionReason
                              ? "Upload corrected file"
                              : "Replace"}
                          </Button>
                        ) : null}
                        {canSubmitItem(item.id) ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 gap-1 bg-primary text-xs hover:bg-champagne-dark"
                            disabled={submitting}
                            onClick={() => setSubmitTarget(item)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Submit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, PNG, WEBP, SVG, or AI/EPS · max 25 MB
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs"
                        disabled={isUploading || locked}
                        onClick={() => inputRefs.current[item.id]?.click()}
                      >
                        {isUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileUp className="h-3.5 w-3.5" />
                        )}
                        Upload artwork
                      </Button>
                      {canSubmitItem(item.id) ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1 bg-primary text-xs hover:bg-champagne-dark"
                          disabled={submitting}
                          onClick={() => setSubmitTarget(item)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Submit
                        </Button>
                      ) : null}
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[item.id] = el;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.svg,.ai,.eps,application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadArtwork(item.id, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </section>
            );
          })}
        </div>

        {readyToSubmitItems.length > 1 ? (
          <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {readyToSubmitItems.length} items have artwork uploaded and are ready to submit.
            </p>
            <Button
              className="gap-1 bg-primary hover:bg-champagne-dark sm:shrink-0"
              disabled={submitting}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-4 w-4" />
              Submit all ready ({readyToSubmitItems.length})
            </Button>
          </div>
        ) : null}
      </Panel>

      {deleteTarget && (
        <ModalShell
          title="Remove branding item?"
          icon={Trash2}
          onClose={() => !deleting && setDeleteTarget(null)}
          footer={
            <>
              <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={deleting}
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => void handleDelete()}
              >
                {deleting ? "Removing…" : "Yes, remove"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p>
              Remove <strong>{deleteTarget.name}</strong> from your branding list? Any draft
              artwork for this item will be deleted.
            </p>
            <p className="text-muted-foreground">
              You can add it again from Additional requirements if needed.
            </p>
          </div>
        </ModalShell>
      )}

      {(confirmOpen || submitTarget) && (
        <ModalShell
          title={
            submitTarget
              ? `Submit ${submitTarget.name}?`
              : `Submit ${readyToSubmitItems.length} items?`
          }
          icon={AlertTriangle}
          onClose={() => !submitting && (setConfirmOpen(false), setSubmitTarget(null))}
          footer={
            <>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setConfirmOpen(false);
                  setSubmitTarget(null);
                }}
              >
                No, go back
              </Button>
              <Button
                disabled={submitting}
                className="gap-1 bg-primary hover:bg-champagne-dark"
                onClick={() =>
                  void handleSubmit(
                    submitTarget ? [submitTarget] : readyToSubmitItems
                  )
                }
              >
                {submitting ? "Submitting…" : "Yes, submit"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p>
              Once submitted, artwork for{" "}
              <strong>{submitTarget ? submitTarget.name : "these items"}</strong> cannot be
              changed unless the printing team marks it as not verified.
            </p>
            <p className="text-muted-foreground">
              Please recheck dimensions, resolution, spelling, and branding colours before you
              continue.
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
