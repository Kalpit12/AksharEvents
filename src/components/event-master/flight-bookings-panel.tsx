"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { sendAirBookingPackageToAgent } from "@/lib/air-booking-actions";
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

export default function FlightBookingsPanel({
  requests,
  exhibitors,
  memberDocuments,
  eventTitle,
  defaultAgentEmail = "",
  defaultCcEmail = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SerializedAirBookingRequest | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState(defaultAgentEmail);
  const [message, setMessage] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  const exhibitorMap = useMemo(
    () => new Map(exhibitors.map((e) => [e.id, e])),
    [exhibitors]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => r.companyName.toLowerCase().includes(q));
  }, [requests, query]);

  const openSendModal = (request: SerializedAirBookingRequest) => {
    setActiveRequest(request);
    setSelectedMemberIds([...request.memberLocalIds]);
    setRecipientEmail(defaultAgentEmail);
    setMessage("");
    setSendOpen(true);
  };

  const membersForRequest = (request: SerializedAirBookingRequest): TeamMember[] => {
    const record = exhibitorMap.get(request.eventExhibitorId);
    return record?.formData?.members?.filter((m) => request.memberLocalIds.includes(m.id)) ?? [];
  };

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

  const toggleMember = (id: string) => {
    setSelectedMemberIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const emailPreview = useMemo(() => {
    if (!activeRequest) return null;
    const selected = membersForRequest(activeRequest).filter((m) =>
      selectedMemberIds.includes(m.id)
    );
    if (selected.length === 0) return null;

    const members = selected.map((m) => ({
      name: `${m.fn} ${m.ln}`,
      email: m.email,
      phone: m.phone,
      passportNumber: m.passportNumber?.trim() || "—",
    }));

    return {
      subject: flightBookingPackageEmailSubject(activeRequest.companyName, eventTitle),
      to: recipientEmail.trim() || defaultAgentEmail || "travel.agent@example.com",
      cc: defaultCcEmail || undefined,
      html: flightBookingPackageEmailHtml({
        companyName: activeRequest.companyName,
        eventTitle,
        travelDate: formatDate(activeRequest.travelDate, "MMM d, yyyy"),
        ticketCount: selected.length,
        members,
        message: message.trim() || undefined,
        attachmentNames: members.map((m) => flightBookingPackageAttachmentName(m.name)),
      }),
    };
  }, [
    activeRequest,
    selectedMemberIds,
    recipientEmail,
    message,
    eventTitle,
    defaultAgentEmail,
    defaultCcEmail,
  ]);

  const submitSend = async () => {
    if (!activeRequest) return;
    if (selectedMemberIds.length === 0) {
      notify.error("Select travellers");
      return;
    }
    if (!recipientEmail.trim()) {
      notify.error("Agent email required");
      return;
    }

    setSending(true);
    try {
      const result = await sendAirBookingPackageToAgent({
        requestId: activeRequest.id,
        recipientEmail: recipientEmail.trim(),
        memberLocalIds: selectedMemberIds,
        message: message.trim() || undefined,
      });
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Booking package sent");
      setSendOpen(false);
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
        <p className="text-sm text-muted-foreground">{filtered.length} request(s)</p>
      </div>

      <div className="space-y-3">
        {filtered.map((request) => {
          const members = membersForRequest(request);
          return (
            <article
              key={request.id}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold tracking-tight">{request.companyName}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        statusClass(request.status)
                      )}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-background px-2 py-1 ring-1 ring-border/60">
                      {request.ticketCount} ticket{request.ticketCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-md bg-background px-2 py-1 ring-1 ring-border/60">
                      Travel {formatDate(request.travelDate, "MMM d, yyyy")}
                    </span>
                    <span className="rounded-md bg-background px-2 py-1 ring-1 ring-border/60">
                      Requested {formatDate(request.requestedAt, "MMM d, yyyy")}
                    </span>
                  </div>
                  {request.notes && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{request.notes}</p>
                  )}
                </div>
                <Button size="sm" className="shrink-0 gap-1.5" onClick={() => openSendModal(request)}>
                  <Mail className="h-4 w-4" />
                  Send to travel agent
                </Button>
              </div>

              <div className="overflow-x-auto px-4 py-3 sm:px-5">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 pb-2 pt-1">Traveller</th>
                      <th className="px-3 pb-2 pt-1">Email</th>
                      <th className="px-3 pb-2 pt-1">Phone</th>
                      <th className="px-3 pb-2 pt-1">Passport</th>
                      <th className="w-[11rem] px-3 pb-2 pt-1">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {members.map((member, index) => {
                      const docs = memberDocStatus(request.eventExhibitorId, member.id);
                      return (
                        <tr
                          key={member.id}
                          className={cn(
                            "transition-colors hover:bg-muted/25",
                            index % 2 === 1 && "bg-muted/10"
                          )}
                        >
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {request.dispatches.length > 0 && (
                <div className="border-t border-border/60 bg-muted/15 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                  Last sent to <span className="font-medium text-foreground">{request.dispatches[0]?.recipientEmail}</span> on{" "}
                  {formatDate(request.dispatches[0]!.sentAt, "MMM d, yyyy")}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {sendOpen && activeRequest && (
        <ModalShell
          title="Send package to travel agent"
          icon={Plane}
          wide
          onClose={() => setSendOpen(false)}
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
              <Label>Recipient email</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="travel.agent@example.com"
              />
              {defaultCcEmail && (
                <p className="text-xs text-muted-foreground">Cc: {defaultCcEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Message to travel agent (optional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Travellers to include</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {membersForRequest(activeRequest).map((member) => {
                  const docs = memberDocsFor(activeRequest.eventExhibitorId, member.id);
                  const checked = selectedMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                        checked ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => toggleMember(member.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{member.fn} {member.ln}</p>
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
                    </label>
                  );
                })}
              </div>
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
