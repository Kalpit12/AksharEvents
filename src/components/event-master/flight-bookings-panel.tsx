"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import {
  canSendMemberRate,
  canSendMemberToTravelAgent,
  memberWasDispatched,
  resolveAdminMemberFlightStatus,
  type SerializedAirBookingMemberWorkflow,
} from "@/lib/air-booking-workflow-types";
import {
  markAirBookingMemberPaid,
  sendAirBookingRateToExhibitor,
  verifyAirBookingMember,
} from "@/lib/air-booking-workflow-actions";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { MemberNameWithTooltip } from "@/components/member-name-with-tooltip";
import { DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL } from "@/lib/flight-booking-config";
import { FLIGHT_BOOKING_CURRENCY_OPTIONS } from "@/lib/flight-booking-currencies";
import { sendCombinedAirBookingPackageToAgent } from "@/lib/air-booking-actions";
import { MEMBER_DOCUMENT_LABELS } from "@/lib/member-document-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ModalShell } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { cn, formatDate } from "@/lib/utils";
import { Check, ChevronDown, ExternalLink, FileText, Mail, MoreHorizontal, Plane, Search, ShieldCheck } from "lucide-react";
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

function workflowStatusClass(key: ReturnType<typeof resolveAdminMemberFlightStatus>["key"]) {
  switch (key) {
    case "sent":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "paid":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "rate_sent":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
    case "verified":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    case "verification_pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

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

type Props = {
  requests: SerializedAirBookingRequest[];
  exhibitors: AdminExhibitorRecord[];
  memberDocuments: SerializedMemberDocument[];
  memberWorkflows?: SerializedAirBookingMemberWorkflow[];
  eventTitle: string;
  defaultAgentEmail?: string;
  defaultCcEmail?: string;
};

type BookingRow = {
  request: SerializedAirBookingRequest;
  member: TeamMember;
};

type CompanyBookingGroup = {
  eventExhibitorId: string;
  companyName: string;
  rows: BookingRow[];
};

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
  memberWorkflows = [],
  eventTitle,
  defaultAgentEmail = DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL,
  defaultCcEmail = "",
}: Props) {
  const router = useRouter();
  const agentEmail = defaultAgentEmail.trim() || DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL;
  const [query, setQuery] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SerializedAirBookingRequest | null>(null);
  const [sendBatches, setSendBatches] = useState<SendBatch[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [companySelection, setCompanySelection] = useState<Record<string, Set<string>>>({});
  const [recipientEmail, setRecipientEmail] = useState(agentEmail);
  const [message, setMessage] = useState("");
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [rateTarget, setRateTarget] = useState<{
    eventExhibitorId: string;
    memberLocalId: string;
    travelDate: string;
    travellerName: string;
    travellerEmail: string | null;
    contactEmail: string | null;
  } | null>(null);
  const [rateForm, setRateForm] = useState({
    amount: "",
    currency: "KES",
    details: "",
  });
  const [workflowBusyKey, setWorkflowBusyKey] = useState<string | null>(null);

  const exhibitorMap = useMemo(
    () => new Map(exhibitors.map((e) => [e.id, e])),
    [exhibitors]
  );

  const membersForRequest = (request: SerializedAirBookingRequest): TeamMember[] => {
    const record = exhibitorMap.get(request.eventExhibitorId);
    return record?.formData?.members?.filter((m) => request.memberLocalIds.includes(m.id)) ?? [];
  };

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => r.companyName.toLowerCase().includes(q));
  }, [requests, query]);

  const companyGroups = useMemo((): CompanyBookingGroup[] => {
    const map = new Map<string, CompanyBookingGroup>();

    for (const request of filteredRequests) {
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
  }, [filteredRequests, exhibitorMap]);

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

  const workflowFor = (eventExhibitorId: string, memberId: string) =>
    memberWorkflows.find(
      (w) => w.eventExhibitorId === eventExhibitorId && w.memberLocalId === memberId
    );

  const canSendToAgent = (eventExhibitorId: string, memberId: string) => {
    if (memberWasDispatched(memberId, requests)) return false;
    return canSendMemberToTravelAgent(workflowFor(eventExhibitorId, memberId)?.status);
  };

  const handleVerify = async (eventExhibitorId: string, memberId: string) => {
    const key = `${eventExhibitorId}:${memberId}:verify`;
    setWorkflowBusyKey(key);
    try {
      const result = await verifyAirBookingMember(eventExhibitorId, memberId);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Traveller verified");
      router.refresh();
    } finally {
      setWorkflowBusyKey(null);
    }
  };

  const openRateModal = (
    eventExhibitorId: string,
    member: TeamMember,
    travelDate: string,
    contactEmail: string | null
  ) => {
    setRateTarget({
      eventExhibitorId,
      memberLocalId: member.id,
      travelDate,
      travellerName: `${member.fn} ${member.ln}`,
      travellerEmail: member.email?.trim() || null,
      contactEmail,
    });
    setRateForm({ amount: "", currency: "KES", details: "" });
    setRateModalOpen(true);
  };

  const submitRate = async () => {
    if (!rateTarget) return;
    const amount = Number(rateForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify.error("Enter a valid rate amount");
      return;
    }

    setRateSubmitting(true);
    try {
      const result = await sendAirBookingRateToExhibitor({
        eventExhibitorId: rateTarget.eventExhibitorId,
        memberLocalId: rateTarget.memberLocalId,
        travelDate: rateTarget.travelDate,
        rateAmount: amount,
        rateCurrency: rateForm.currency.trim() || "KES",
        rateDetails: rateForm.details.trim() || undefined,
      });
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Flight rate emailed to exhibitor contact");
      setRateModalOpen(false);
      setRateTarget(null);
      router.refresh();
    } finally {
      setRateSubmitting(false);
    }
  };

  const handleMarkPaid = async (eventExhibitorId: string, memberId: string) => {
    const key = `${eventExhibitorId}:${memberId}:paid`;
    setWorkflowBusyKey(key);
    try {
      const result = await markAirBookingMemberPaid(eventExhibitorId, memberId);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Marked as paid");
      router.refresh();
    } finally {
      setWorkflowBusyKey(null);
    }
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
    const allKeys = group.rows
      .filter((row) => canSendToAgent(row.request.eventExhibitorId, row.member.id))
      .map((row) => rowSelectionKey(row.request.id, row.member.id));
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
          {companyGroups.length} compan{companyGroups.length === 1 ? "y" : "ies"} · {filteredRequests.length} request
          {filteredRequests.length === 1 ? "" : "s"}
        </p>
      </div>

      {companyGroups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Plane className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No flight booking requests match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different company name or clear the search field.
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
            const allRowKeys = group.rows
              .filter((row) => canSendToAgent(row.request.eventExhibitorId, row.member.id))
              .map((row) => rowSelectionKey(row.request.id, row.member.id));
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
                </div>

                <div className="overflow-x-auto px-4 py-3 sm:px-5">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                        <th className="px-3 pb-2 pt-1">Traveller</th>
                        <th className="px-3 pb-2 pt-1">Passport</th>
                        <th className="w-[11rem] px-3 pb-2 pt-1">Documents</th>
                        <th className="px-3 pb-2 pt-1">Travel date</th>
                        <th className="px-3 pb-2 pt-1">Status</th>
                        <th className="px-3 pb-2 pt-1">Sent</th>
                        <th className="px-3 pb-2 pt-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {group.rows.map(({ request, member }, index) => {
                        const docs = memberDocStatus(request.eventExhibitorId, member.id);
                        const memberDispatch = request.dispatches.find((d) =>
                          d.memberLocalIds.includes(member.id)
                        );
                        const selectionKey = rowSelectionKey(request.id, member.id);
                        const isSelected = selectedKeys.has(selectionKey);
                        const workflow = workflowFor(request.eventExhibitorId, member.id);
                        const flightStatus = resolveAdminMemberFlightStatus(
                          member.id,
                          memberWorkflows,
                          requests,
                          docs.hasPassport
                        );
                        const exhibitorRecord = exhibitorMap.get(request.eventExhibitorId);
                        const sendAllowed = canSendToAgent(request.eventExhibitorId, member.id);
                        const alreadySent = memberWasDispatched(member.id, requests);
                        const busyVerify = workflowBusyKey === `${request.eventExhibitorId}:${member.id}:verify`;
                        const busyPaid = workflowBusyKey === `${request.eventExhibitorId}:${member.id}:paid`;
                        return (
                          <tr
                            key={selectionKey}
                            className={cn(
                              "transition-colors hover:bg-muted/25",
                              index % 2 === 1 && "bg-muted/10",
                              isSelected && "bg-primary/5"
                            )}
                          >
                            <td className="px-2 py-2.5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border disabled:opacity-40"
                                checked={isSelected}
                                disabled={!sendAllowed}
                                title={
                                  sendAllowed
                                    ? undefined
                                    : alreadySent
                                      ? "Already sent to travel agent"
                                      : "Verify traveller before sending to travel agent"
                                }
                                onChange={() =>
                                  toggleRowSelection(group.eventExhibitorId, request.id, member.id)
                                }
                                aria-label={`Select ${member.fn} ${member.ln}`}
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <MemberNameWithTooltip member={member} />
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
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                  workflowStatusClass(flightStatus.key)
                                )}
                              >
                                {flightStatus.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">
                              {memberDispatch ? (
                                <>
                                  <span className="font-medium text-foreground">
                                    {memberDispatch.recipientEmail}
                                  </span>
                                  <br />
                                  {formatDate(memberDispatch.sentAt, "MMM d, yyyy")}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <TravellerWorkflowMenu
                                workflowStatus={workflow?.status}
                                dispatched={alreadySent}
                                busyVerify={busyVerify}
                                busyPaid={busyPaid}
                                onVerify={() =>
                                  void handleVerify(request.eventExhibitorId, member.id)
                                }
                                onSendRate={() =>
                                  openRateModal(
                                    request.eventExhibitorId,
                                    member,
                                    request.travelDate,
                                    exhibitorRecord?.contactEmail ?? request.contactEmail
                                  )
                                }
                                onMarkPaid={() =>
                                  void handleMarkPaid(request.eventExhibitorId, member.id)
                                }
                              />
                            </td>
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

      {rateModalOpen && rateTarget && (
        <ModalShell
          title="Send flight rate"
          icon={Mail}
          onClose={() => {
            setRateModalOpen(false);
            setRateTarget(null);
          }}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setRateModalOpen(false);
                  setRateTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitRate} disabled={rateSubmitting} className="gap-1.5">
                <Mail className="h-4 w-4" />
                {rateSubmitting ? "Sending…" : "Send rate email"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Traveller
                  </p>
                  <p className="mt-0.5 font-medium">{rateTarget.travellerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-0.5 font-medium">
                    {rateTarget.travellerEmail || "—"}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The rate quote will be emailed to the exhibitor&apos;s main contact
              {rateTarget.contactEmail ? (
                <>
                  {" "}
                  (<span className="font-medium text-foreground">{rateTarget.contactEmail}</span>)
                </>
              ) : (
                " on file"
              )}
              . Payment is handled outside the portal.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="space-y-2">
                <Label>Rate amount</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rateForm.amount}
                  onChange={(e) => setRateForm({ ...rateForm, amount: e.target.value })}
                  placeholder="45000"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <CustomSelect
                  value={rateForm.currency}
                  onChange={(currency) => setRateForm({ ...rateForm, currency })}
                  options={FLIGHT_BOOKING_CURRENCY_OPTIONS}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Flight details (optional)</Label>
              <Textarea
                value={rateForm.details}
                onChange={(e) => setRateForm({ ...rateForm, details: e.target.value })}
                rows={3}
                placeholder="Airline, route, class, baggage…"
              />
            </div>
          </div>
        </ModalShell>
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
              Email is sent through Postmark with traveller PDFs attached.
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
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function TravellerWorkflowMenu({
  workflowStatus,
  dispatched,
  busyVerify,
  busyPaid,
  onVerify,
  onSendRate,
  onMarkPaid,
}: {
  workflowStatus?: SerializedAirBookingMemberWorkflow["status"];
  dispatched: boolean;
  busyVerify: boolean;
  busyPaid: boolean;
  onVerify: () => void;
  onSendRate: () => void;
  onMarkPaid: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 176;
    const left = Math.min(rect.right - width, window.innerWidth - width - 12);
    setMenuStyle({ top: rect.bottom + 6, left, width });
    setOpen(true);
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
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const items: { label: string; onClick: () => void; disabled?: boolean }[] = [];
  if (!dispatched && (!workflowStatus || workflowStatus === "VERIFICATION_PENDING")) {
    items.push({ label: busyVerify ? "Verifying…" : "Verified", onClick: onVerify, disabled: busyVerify });
  }
  if (canSendMemberRate(workflowStatus, dispatched)) {
    items.push({ label: "Send rate", onClick: onSendRate });
  }
  if (workflowStatus === "RATE_SENT") {
    items.push({
      label: busyPaid ? "Updating…" : "Mark paid",
      onClick: onMarkPaid,
      disabled: busyPaid,
    });
  }

  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label="Workflow actions"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[200] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
            style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted/60 disabled:opacity-50"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
