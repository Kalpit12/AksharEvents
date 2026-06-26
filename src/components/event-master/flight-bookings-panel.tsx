"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL } from "@/lib/flight-booking-config";
import { sendCombinedAirBookingPackageToAgent } from "@/lib/air-booking-actions";
import {
  flightBookingPackageAttachmentName,
  flightBookingPackageEmailHtml,
  flightBookingPackageEmailSubject,
} from "@/lib/email-templates/flight-booking-package";
import { MEMBER_DOCUMENT_LABELS } from "@/lib/member-document-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ModalShell } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { cn, formatDate } from "@/lib/utils";
import { Check, ChevronDown, ExternalLink, Eye, FileText, Mail, Plane, Search, ShieldCheck } from "lucide-react";
import { notify } from "@/lib/notify";
import type { MemberDocumentType } from "@prisma/client";

const DOC_TYPE_ORDER: MemberDocumentType[] = [
  "PASSPORT",
  "VISA",
  "NATIONAL_ID",
  "YELLOW_FEVER",
  "OTHER",
];

function sortMemberDocuments(docs: SerializedMemberDocument[]) {
  return [...docs].sort(
    (a, b) => DOC_TYPE_ORDER.indexOf(a.documentType) - DOC_TYPE_ORDER.indexOf(b.documentType)
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MemberDocumentsDropdown({
  docs,
  compact = false,
}: {
  docs: SerializedMemberDocument[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortMemberDocuments(docs), [docs]);
  const hasPassport = sorted.some((d) => d.documentType === "PASSPORT");
  const countLabel = `${docs.length} document${docs.length === 1 ? "" : "s"}`;

  const openMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(compact ? 260 : 300, rect.width);
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const top = rect.bottom + 6;
    setMenuStyle({ top, left, width });
    setOpen(true);
  };

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }
    openMenu();
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onScrollOrResize = () => setOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  if (docs.length === 0) {
    return <span className="text-xs font-medium text-amber-700 dark:text-amber-400">None uploaded</span>;
  }

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 60,
            }}
            className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-2.5 shadow-lg ring-1 ring-black/5"
          >
            {hasPassport && (
              <p className="mb-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Passport on file
              </p>
            )}
            <ul className="space-y-1">
              {sorted.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight">
                      {MEMBER_DOCUMENT_LABELS[doc.documentType]}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground" title={doc.originalFileName}>
                      {doc.originalFileName}
                      {!compact && ` · ${formatFileSize(doc.fileSize)}`}
                    </p>
                  </div>
                  <a
                    href={`/api/exhibitor/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-champagne-dark hover:underline dark:text-champagne-light"
                    onClick={() => setOpen(false)}
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex w-full max-w-[11rem] items-center justify-between gap-2 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-left text-xs font-medium shadow-sm transition-colors hover:bg-muted/40",
          open && "border-champagne/50 ring-1 ring-champagne/20"
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {hasPassport && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          )}
          <span className="truncate">{countLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {menu}
    </>
  );
}

function travellerInitials(member: TeamMember) {
  return `${member.fn[0] ?? ""}${member.ln[0] ?? ""}`.toUpperCase() || "?";
}

type Props = {
  requests: SerializedAirBookingRequest[];
  exhibitors: AdminExhibitorRecord[];
  memberDocuments: SerializedMemberDocument[];
  eventTitle: string;
  defaultAgentEmail?: string;
  defaultCcEmail?: string;
};

function statusClass(status: SerializedAirBookingRequest["status"]) {
  switch (status) {
    case "SENT":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "CONFIRMED":
      return "bg-teal-100 text-teal-800";
    case "CANCELLED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  }
}

function isPendingStatus(status: SerializedAirBookingRequest["status"]) {
  return status === "PENDING";
}

function isCompletedStatus(status: SerializedAirBookingRequest["status"]) {
  return status === "SENT" || status === "CONFIRMED";
}

type BookingRow = {
  request: SerializedAirBookingRequest;
  member: TeamMember;
};

type CompanyBookingGroup = {
  eventExhibitorId: string;
  companyName: string;
  rows: BookingRow[];
};

type StatusTab = "pending" | "completed";

type SendBatch = {
  request: SerializedAirBookingRequest;
  memberIds: string[];
};

function rowSelectionKey(requestId: string, memberId: string) {
  return `${requestId}:${memberId}`;
}

function summarizeRequests(requests: SerializedAirBookingRequest[]) {
  const map = new Map<
    string,
    { travelDate: string; status: SerializedAirBookingRequest["status"]; tickets: number }
  >();
  for (const request of requests) {
    const key = `${request.travelDate}-${request.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.tickets += request.ticketCount;
    } else {
      map.set(key, {
        travelDate: request.travelDate,
        status: request.status,
        tickets: request.ticketCount,
      });
    }
  }
  return [...map.values()];
}

export default function FlightBookingsPanel({
  requests,
  exhibitors,
  memberDocuments,
  eventTitle,
  defaultAgentEmail = DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL,
  defaultCcEmail = "",
}: Props) {
  const router = useRouter();
  const agentEmail = defaultAgentEmail.trim() || DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL;
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [query, setQuery] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SerializedAirBookingRequest | null>(null);
  const [sendBatches, setSendBatches] = useState<SendBatch[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [companySelection, setCompanySelection] = useState<Record<string, Set<string>>>({});
  const [recipientEmail, setRecipientEmail] = useState(agentEmail);
  const [message, setMessage] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  const exhibitorMap = useMemo(
    () => new Map(exhibitors.map((e) => [e.id, e])),
    [exhibitors]
  );

  const membersForRequest = (request: SerializedAirBookingRequest): TeamMember[] => {
    const record = exhibitorMap.get(request.eventExhibitorId);
    return record?.formData?.members?.filter((m) => request.memberLocalIds.includes(m.id)) ?? [];
  };

  const pendingCount = useMemo(
    () => requests.filter((r) => isPendingStatus(r.status)).length,
    [requests]
  );
  const completedCount = useMemo(
    () => requests.filter((r) => isCompletedStatus(r.status)).length,
    [requests]
  );

  const tabRequests = useMemo(() => {
    const byStatus =
      statusTab === "pending"
        ? requests.filter((r) => isPendingStatus(r.status))
        : requests.filter((r) => isCompletedStatus(r.status));
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) => r.companyName.toLowerCase().includes(q));
  }, [requests, statusTab, query]);

  const companyGroups = useMemo((): CompanyBookingGroup[] => {
    const map = new Map<string, CompanyBookingGroup>();

    for (const request of tabRequests) {
      for (const member of membersForRequest(request)) {
        let group = map.get(request.eventExhibitorId);
        if (!group) {
          group = {
            eventExhibitorId: request.eventExhibitorId,
            companyName: request.companyName,
            rows: [],
          };
          map.set(request.eventExhibitorId, group);
        }
        group.rows.push({ request, member });
      }
    }

    for (const group of map.values()) {
      group.rows.sort((a, b) => {
        const dateCmp =
          new Date(a.request.travelDate).getTime() - new Date(b.request.travelDate).getTime();
        if (dateCmp !== 0) return dateCmp;
        const nameA = `${a.member.fn} ${a.member.ln}`;
        const nameB = `${b.member.fn} ${b.member.ln}`;
        return nameA.localeCompare(nameB);
      });
    }

    return [...map.values()].sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [tabRequests, exhibitorMap]);

  const filtered = tabRequests;

  const memberDocsFor = (eventExhibitorId: string, memberId: string) =>
    memberDocuments.filter(
      (d) => d.eventExhibitorId === eventExhibitorId && d.memberLocalId === memberId
    );

  const memberDocStatus = (eventExhibitorId: string, memberId: string) => {
    const docs = memberDocsFor(eventExhibitorId, memberId);
    return {
      hasPassport: docs.some((d) => d.documentType === "PASSPORT"),
      count: docs.length,
      docs,
    };
  };

  const getCompanySelectedKeys = (eventExhibitorId: string) =>
    companySelection[eventExhibitorId] ?? new Set<string>();

  const toggleRowSelection = (eventExhibitorId: string, requestId: string, memberId: string) => {
    const key = rowSelectionKey(requestId, memberId);
    setCompanySelection((prev) => {
      const current = new Set(prev[eventExhibitorId] ?? []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...prev, [eventExhibitorId]: current };
    });
  };

  const toggleAllInCompany = (group: CompanyBookingGroup) => {
    const allKeys = group.rows.map((row) => rowSelectionKey(row.request.id, row.member.id));
    const current = getCompanySelectedKeys(group.eventExhibitorId);
    const allSelected = allKeys.length > 0 && allKeys.every((key) => current.has(key));
    setCompanySelection((prev) => ({
      ...prev,
      [group.eventExhibitorId]: allSelected ? new Set() : new Set(allKeys),
    }));
  };

  const openSendForCompanyGroup = (group: CompanyBookingGroup) => {
    const selected = getCompanySelectedKeys(group.eventExhibitorId);
    if (selected.size === 0) {
      notify.error("Select at least one traveller");
      return;
    }

    const batchesMap = new Map<string, SendBatch>();
    for (const row of group.rows) {
      const key = rowSelectionKey(row.request.id, row.member.id);
      if (!selected.has(key)) continue;
      const existing = batchesMap.get(row.request.id);
      if (existing) {
        existing.memberIds.push(row.member.id);
      } else {
        batchesMap.set(row.request.id, {
          request: row.request,
          memberIds: [row.member.id],
        });
      }
    }

    const batches = [...batchesMap.values()];
    if (batches.length === 0) {
      notify.error("Select at least one traveller");
      return;
    }

    setSendBatches(batches);
    setActiveRequest(batches[0]!.request);
    setSelectedMemberIds(batches[0]!.memberIds);
    setRecipientEmail(agentEmail);
    setMessage("");
    setSendOpen(true);
  };

  const clearCompanySelection = (eventExhibitorId: string) => {
    setCompanySelection((prev) => {
      const next = { ...prev };
      delete next[eventExhibitorId];
      return next;
    });
  };

  const modalTravellers = useMemo(() => {
    if (sendBatches.length === 0 || !activeRequest) return [];
    return sendBatches.flatMap((batch) =>
      membersForRequest(batch.request).filter((m) => batch.memberIds.includes(m.id))
    );
  }, [sendBatches, activeRequest, exhibitorMap]);

  const emailPreview = useMemo(() => {
    if (!activeRequest || modalTravellers.length === 0) return null;

    const members = modalTravellers.map((m) => ({
      name: `${m.fn} ${m.ln}`,
      email: m.email,
      phone: m.phone,
      passportNumber: m.passportNumber?.trim() || "—",
    }));

    const previewTravelDate =
      sendBatches[0]?.request.travelDate ?? activeRequest.travelDate;

    return {
      subject: flightBookingPackageEmailSubject(activeRequest.companyName, eventTitle),
      to: recipientEmail.trim() || agentEmail,
      cc: defaultCcEmail || undefined,
      html: flightBookingPackageEmailHtml({
        companyName: activeRequest.companyName,
        eventTitle,
        travelDate: formatDate(previewTravelDate, "MMM d, yyyy"),
        ticketCount: members.length,
        members,
        message: message.trim() || undefined,
        attachmentNames: members.map((m, i) =>
          flightBookingPackageAttachmentName(m.name, i + 1)
        ),
      }),
    };
  }, [
    activeRequest,
    modalTravellers,
    sendBatches,
    recipientEmail,
    message,
    eventTitle,
    agentEmail,
    defaultCcEmail,
  ]);

  const submitSend = async () => {
    const batches =
      sendBatches.length > 0
        ? sendBatches
        : activeRequest
          ? [{ request: activeRequest, memberIds: selectedMemberIds }]
          : [];

    if (batches.length === 0) return;
    if (!recipientEmail.trim() && !agentEmail) {
      notify.error("Agent email required");
      return;
    }

    const toEmail = recipientEmail.trim() || agentEmail;

    setSending(true);
    try {
      const totalMembers = batches.reduce((n, b) => n + b.memberIds.length, 0);
      if (totalMembers === 0) {
        notify.error("Select travellers");
        return;
      }

      const result = await sendCombinedAirBookingPackageToAgent({
        eventExhibitorId: batches[0]!.request.eventExhibitorId,
        recipientEmail: toEmail,
        message: message.trim() || undefined,
        packages: batches.map((batch) => ({
          requestId: batch.request.id,
          memberLocalIds: batch.memberIds,
        })),
      });
      if (result.error) {
        notify.error(result.error);
        return;
      }

      notify.success(
        totalMembers === 1
          ? "Booking package sent to travel agent"
          : `One booking email sent with ${totalMembers} travellers`
      );
      if (activeRequest) clearCompanySelection(activeRequest.eventExhibitorId);
      setSendOpen(false);
      setSendBatches([]);
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Plane className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No flight booking requests yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When exhibitors submit air booking requests from their team section, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setStatusTab("pending")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
            statusTab === "pending"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Pending
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              statusTab === "pending" ? "bg-white/20" : "bg-muted"
            )}
          >
            {pendingCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStatusTab("completed")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
            statusTab === "completed"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Completed
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              statusTab === "completed" ? "bg-white/20" : "bg-muted"
            )}
          >
            {completedCount}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company…"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {companyGroups.length} compan{companyGroups.length === 1 ? "y" : "ies"} · {filtered.length} request
          {filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {companyGroups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Plane className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">
            No {statusTab === "pending" ? "pending" : "completed"} flight booking requests
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusTab === "pending"
              ? "New exhibitor requests will appear here until they are sent to the travel agent."
              : "Requests sent or confirmed by the travel agent will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {companyGroups.map((group) => {
            const uniqueRequests = [...new Map(group.rows.map((r) => [r.request.id, r.request])).values()];
            const requestSummaries = summarizeRequests(uniqueRequests);
            const travellerCount = group.rows.length;
            const selectedKeys = getCompanySelectedKeys(group.eventExhibitorId);
            const selectedCount = selectedKeys.size;
            const allRowKeys = group.rows.map((row) => rowSelectionKey(row.request.id, row.member.id));
            const allSelected =
              allRowKeys.length > 0 && allRowKeys.every((key) => selectedKeys.has(key));
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <article
                key={group.eventExhibitorId}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight">{group.companyName}</h3>
                      <span className="rounded-full bg-background px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border/60">
                        {travellerCount} traveller{travellerCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {requestSummaries.map((summary) => (
                        <span
                          key={`${summary.travelDate}-${summary.status}`}
                          className="rounded-md bg-background px-2 py-1 ring-1 ring-border/60"
                        >
                          {summary.tickets} ticket{summary.tickets === 1 ? "" : "s"} · Travel{" "}
                          {formatDate(summary.travelDate, "MMM d, yyyy")} ·{" "}
                          <span
                            className={cn(
                              "inline-flex rounded px-1 py-0.5 text-[10px] font-semibold uppercase",
                              statusClass(summary.status)
                            )}
                          >
                            {summary.status}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {statusTab === "pending" && (
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={selectedCount === 0}
                      onClick={() => openSendForCompanyGroup(group)}
                    >
                      <Mail className="h-4 w-4" />
                      Send to travel agent
                      {selectedCount > 0 ? ` (${selectedCount})` : ""}
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto px-4 py-3 sm:px-5">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {statusTab === "pending" && (
                          <th className="w-10 px-2 pb-2 pt-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                              }}
                              onChange={() => toggleAllInCompany(group)}
                              aria-label={`Select all travellers for ${group.companyName}`}
                            />
                          </th>
                        )}
                        <th className="px-3 pb-2 pt-1">Traveller</th>
                        <th className="px-3 pb-2 pt-1">Email</th>
                        <th className="px-3 pb-2 pt-1">Phone</th>
                        <th className="px-3 pb-2 pt-1">Passport</th>
                        <th className="w-[11rem] px-3 pb-2 pt-1">Documents</th>
                        <th className="px-3 pb-2 pt-1">Travel date</th>
                        {statusTab === "completed" && (
                          <th className="px-3 pb-2 pt-1">Sent</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {group.rows.map(({ request, member }, index) => {
                        const docs = memberDocStatus(request.eventExhibitorId, member.id);
                        const lastDispatch = request.dispatches[0];
                        const selectionKey = rowSelectionKey(request.id, member.id);
                        const isSelected = selectedKeys.has(selectionKey);
                        return (
                          <tr
                            key={selectionKey}
                            className={cn(
                              "transition-colors hover:bg-muted/25",
                              index % 2 === 1 && "bg-muted/10",
                              isSelected && statusTab === "pending" && "bg-primary/5"
                            )}
                          >
                            {statusTab === "pending" && (
                              <td className="px-2 py-2.5">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-border"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleRowSelection(group.eventExhibitorId, request.id, member.id)
                                  }
                                  aria-label={`Select ${member.fn} ${member.ln}`}
                                />
                              </td>
                            )}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/15 text-[11px] font-semibold text-champagne-dark">
                                  {travellerInitials(member)}
                                </span>
                                <span className="font-medium whitespace-nowrap">
                                  {member.fn} {member.ln}
                                </span>
                              </div>
                            </td>
                            <td className="max-w-[11rem] truncate px-3 py-2.5 text-muted-foreground">
                              {member.email}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                              {member.phone}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
                              {member.passportNumber || "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <MemberDocumentsDropdown docs={docs.docs} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                              {formatDate(request.travelDate, "MMM d, yyyy")}
                            </td>
                            {statusTab === "completed" && (
                              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                {lastDispatch ? (
                                  <>
                                    <span className="font-medium text-foreground">
                                      {lastDispatch.recipientEmail}
                                    </span>
                                    <br />
                                    {formatDate(lastDispatch.sentAt, "MMM d, yyyy")}
                                  </>
                                ) : (
                                  "—"
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sendOpen && activeRequest && (
        <ModalShell
          title="Send package to travel agent"
          icon={Plane}
          wide
          onClose={() => {
            setSendOpen(false);
            setSendBatches([]);
          }}
          footer={
            <>
              <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
              <Button onClick={submitSend} disabled={sending} className="gap-1.5">
                <Mail className="h-4 w-4" />
                {sending ? "Sending…" : "Send via Postmark"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Email is sent through Postmark with traveller PDFs attached. Review the preview before sending.
            </p>
            <div className="space-y-2">
              <Label>Travel agent</Label>
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground">
                {agentEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                Packages are sent to this address via Postmark.
              </p>
              {defaultCcEmail && (
                <p className="text-xs text-muted-foreground">Cc: {defaultCcEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Message to travel agent (optional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Selected travellers ({modalTravellers.length})</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {modalTravellers.map((member, index) => {
                  const eventExhibitorId =
                    sendBatches[0]?.request.eventExhibitorId ?? activeRequest.eventExhibitorId;
                  const docs = memberDocsFor(eventExhibitorId, member.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {index + 1}. {member.fn} {member.ln}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email} · {member.phone} · Passport {member.passportNumber || "—"}
                        </p>
                        <div className="mt-2">
                          <MemberDocumentsDropdown docs={docs} compact />
                        </div>
                      </div>
                      {docs.some((d) => d.documentType === "PASSPORT") && (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>
              {modalTravellers.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  All {modalTravellers.length} travellers will be included in one email to the travel agent.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                onClick={() => setShowEmailPreview((open) => !open)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4 text-champagne-dark" />
                  Email preview
                </span>
                <span className="text-xs text-muted-foreground">
                  {showEmailPreview ? "Hide" : "Show"}
                </span>
              </button>
              {showEmailPreview && emailPreview && (
                <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                  <div className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Subject:</span> {emailPreview.subject}</p>
                    <p className="mt-1"><span className="font-medium text-foreground">To:</span> {emailPreview.to}</p>
                    {emailPreview.cc && (
                      <p className="mt-1"><span className="font-medium text-foreground">Cc:</span> {emailPreview.cc}</p>
                    )}
                    <p className="mt-1"><span className="font-medium text-foreground">Via:</span> Postmark</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-[#f9f6f0]">
                    <iframe
                      title="Flight booking email preview"
                      srcDoc={emailPreview.html}
                      className="h-[420px] w-full border-0 bg-white"
                      sandbox=""
                    />
                  </div>
                </div>
              )}
              {showEmailPreview && !emailPreview && (
                <p className="border-t border-border px-4 pb-4 pt-3 text-xs text-muted-foreground">
                  Select at least one traveller to preview the email.
                </p>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
