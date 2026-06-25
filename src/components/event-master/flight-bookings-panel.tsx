"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedAirBookingRequest } from "@/lib/air-booking-types";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { sendAirBookingPackageToAgent } from "@/lib/air-booking-actions";
import { MEMBER_DOCUMENT_LABELS } from "@/lib/member-document-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ModalShell } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { cn, formatDate } from "@/lib/utils";
import { Check, Mail, Plane, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Props = {
  requests: SerializedAirBookingRequest[];
  exhibitors: AdminExhibitorRecord[];
  memberDocuments: SerializedMemberDocument[];
  defaultAgentEmail?: string;
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
  defaultAgentEmail = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SerializedAirBookingRequest | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState(defaultAgentEmail);
  const [message, setMessage] = useState("");

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

  const memberDocStatus = (eventExhibitorId: string, memberId: string) => {
    const docs = memberDocuments.filter(
      (d) => d.eventExhibitorId === eventExhibitorId && d.memberLocalId === memberId
    );
    return {
      hasPassport: docs.some((d) => d.documentType === "PASSPORT"),
      count: docs.length,
    };
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const submitSend = async () => {
    if (!activeRequest) return;
    if (selectedMemberIds.length === 0) {
      toast.error("Select at least one traveller");
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error("Enter the travel agent email");
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
        toast.error(result.error);
        return;
      }
      toast.success("Flight booking package sent");
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
            <article key={request.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{request.companyName}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase", statusClass(request.status))}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.ticketCount} ticket{request.ticketCount === 1 ? "" : "s"} · Travel {formatDate(request.travelDate, "MMM d, yyyy")} · Requested {formatDate(request.requestedAt, "MMM d, yyyy")}
                  </p>
                  {request.notes && <p className="mt-2 text-sm">{request.notes}</p>}
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => openSendModal(request)}>
                  <Mail className="h-4 w-4" />
                  Send to travel agent
                </Button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Traveller</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Passport #</th>
                      <th className="px-3 py-2">Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const docs = memberDocStatus(request.eventExhibitorId, member.id);
                      return (
                        <tr key={member.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium">{member.fn} {member.ln}</td>
                          <td className="px-3 py-2 text-muted-foreground">{member.email}</td>
                          <td className="px-3 py-2 text-muted-foreground">{member.phone}</td>
                          <td className="px-3 py-2">{member.passportNumber || "—"}</td>
                          <td className="px-3 py-2">
                            {docs.hasPassport ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {docs.count} file{docs.count === 1 ? "" : "s"}
                              </span>
                            ) : (
                              <span className="text-amber-700">Passport missing</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {request.dispatches.length > 0 && (
                <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Last sent to {request.dispatches[0]?.recipientEmail} on {formatDate(request.dispatches[0]!.sentAt, "MMM d, yyyy")}
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
          onClose={() => setSendOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
              <Button onClick={submitSend} disabled={sending} className="gap-1.5">
                <Mail className="h-4 w-4" />
                {sending ? "Sending…" : "Send email with PDFs"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select travellers to include. Each person will be sent as a separate PDF attachment named like &quot;Kalpit Patel Documents.pdf&quot;.
            </p>
            <div className="space-y-2">
              <Label>Recipient email</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="travel.agent@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Message to travel agent (optional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Travellers to include</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {membersForRequest(activeRequest).map((member) => {
                  const docs = memberDocuments.filter(
                    (d) =>
                      d.memberLocalId === member.id &&
                      d.eventExhibitorId === activeRequest.eventExhibitorId
                  );
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
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {docs.length > 0
                            ? docs.map((d) => MEMBER_DOCUMENT_LABELS[d.documentType]).join(", ")
                            : "No documents uploaded"}
                        </p>
                      </div>
                      {docs.some((d) => d.documentType === "PASSPORT") && (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
