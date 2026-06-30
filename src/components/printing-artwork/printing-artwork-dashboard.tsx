"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BRANDING_ARTWORK_STATUS_BADGE,
  BRANDING_ARTWORK_STATUS_LABELS,
  printingStaffActionsFor,
  type AdminBrandingArtworkRecord,
} from "@/lib/branding-artwork-types";
import { updateBrandingArtworkStatus } from "@/lib/branding-artwork-actions";
import Ferrofluid from "@/components/ferrofluid/Ferrofluid";
import { HERO_FERROFLUID } from "@/lib/hero-ferrofluid";
import { ModalShell } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn, formatDate } from "@/lib/utils";
import { useUrlStringState } from "@/hooks/use-dashboard-url-state";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Palette,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { notify } from "@/lib/notify";

type CompanyGroup = {
  eventExhibitorId: string;
  companyName: string;
  boothNumber: string | null;
  hall: string | null;
  contactName: string | null;
  contactEmail: string | null;
  submissions: AdminBrandingArtworkRecord[];
  awaitingReview: number;
  inProduction: number;
  completed: number;
};

function groupByCompany(records: AdminBrandingArtworkRecord[]): CompanyGroup[] {
  const map = new Map<string, CompanyGroup>();

  for (const row of records) {
    const existing = map.get(row.eventExhibitorId);
    const isAwaiting = row.status === "SUBMITTED";
    const isProduction = [
      "VERIFIED",
      "SENT_FOR_PRINTING",
      "PRINTING_IN_PROCESS",
      "ARTWORK_DELIVERED",
    ].includes(row.status);
    const isComplete = row.status === "ARTWORK_AFFIXED";

    if (existing) {
      existing.submissions.push(row);
      if (isAwaiting) existing.awaitingReview++;
      if (isProduction) existing.inProduction++;
      if (isComplete) existing.completed++;
    } else {
      map.set(row.eventExhibitorId, {
        eventExhibitorId: row.eventExhibitorId,
        companyName: row.companyName,
        boothNumber: row.boothNumber,
        hall: row.hall,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        submissions: [row],
        awaitingReview: isAwaiting ? 1 : 0,
        inProduction: isProduction ? 1 : 0,
        completed: isComplete ? 1 : 0,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.companyName.localeCompare(b.companyName));
}

type Props = {
  eventTitle: string;
  eventLocation: string;
  dateRange: string;
  records: AdminBrandingArtworkRecord[];
};

export default function PrintingArtworkDashboard({
  eventTitle,
  eventLocation,
  dateRange,
  records,
}: Props) {
  const router = useRouter();
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useUrlStringState("company", "");
  const [rejectTarget, setRejectTarget] = useState<AdminBrandingArtworkRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const companies = useMemo(() => groupByCompany(records), [records]);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        (c.boothNumber?.toLowerCase().includes(q) ?? false) ||
        (c.contactEmail?.toLowerCase().includes(q) ?? false)
    );
  }, [companies, companyQuery]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.eventExhibitorId === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const totals = useMemo(
    () => ({
      companies: companies.length,
      submissions: records.length,
      awaiting: records.filter((r) => r.status === "SUBMITTED").length,
      affixed: records.filter((r) => r.status === "ARTWORK_AFFIXED").length,
    }),
    [companies.length, records]
  );

  const runAction = async (
    submissionId: string,
    action: "verify" | "reject" | "advance",
    rejectionReason?: string
  ) => {
    setBusyId(submissionId);
    try {
      const result = await updateBrandingArtworkStatus({ submissionId, action, rejectionReason });
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Status updated");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      notify.error("Please enter a reason");
      return;
    }
    await runAction(rejectTarget.id, "reject", reason);
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-5">
      <section className="relative min-h-[200px] overflow-hidden rounded-2xl border border-champagne/30 bg-espresso text-alabaster shadow-lg shadow-espresso/10 sm:min-h-[220px]">
        <Ferrofluid {...HERO_FERROFLUID} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-espresso/82 via-espresso/58 to-champagne-dark/38" />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-alabaster/10 bg-alabaster/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Printing / Artwork Dashboard
              </div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{eventTitle}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {eventLocation}
                </span>
                <span>{dateRange}</span>
              </p>
              <p className="mt-2 max-w-2xl text-sm text-white">
                Select an exhibitor company to review their branding artwork, verify files, and
                advance each item through printing and delivery.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Companies", value: totals.companies },
              { label: "Artwork items", value: totals.submissions },
              { label: "Awaiting review", value: totals.awaiting },
              { label: "Affixed", value: totals.completed },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-alabaster/10 bg-alabaster/10 px-3 py-2.5 backdrop-blur-sm"
              >
                <div className="text-[11px] text-champagne-light/70">{m.label}</div>
                <div className="text-xl font-semibold text-alabaster">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <Palette className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No submitted artwork yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Exhibitors upload branding files from their portal after selecting items under Additional
            requirements.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-border bg-card p-3">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Search companies…"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Exhibitor companies
            </p>
            <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
              {filteredCompanies.map((company) => {
                const selected = company.eventExhibitorId === selectedCompanyId;
                return (
                  <li key={company.eventExhibitorId}>
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyId(company.eventExhibitorId)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-champagne/10 shadow-sm ring-1 ring-primary/20"
                          : "border-transparent hover:border-champagne/30 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{company.companyName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {company.boothNumber ? `Booth #${company.boothNumber}` : "Booth TBC"}
                            {company.hall ? ` · ${company.hall}` : ""}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {company.awaitingReview > 0 ? (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                                {company.awaitingReview} review
                              </span>
                            ) : null}
                            {company.inProduction > 0 ? (
                              <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                                {company.inProduction} in progress
                              </span>
                            ) : null}
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {company.submissions.length} item{company.submissions.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <main className="min-w-0 rounded-2xl border border-border bg-card">
            {!selectedCompany ? (
              <div className="flex min-h-[20rem] flex-col items-center justify-center px-6 py-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Select a company</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Choose an exhibitor from the list to manage their branding artwork and update
                  production statuses.
                </p>
              </div>
            ) : (
              <CompanyArtworkPanel
                company={selectedCompany}
                busyId={busyId}
                onVerify={(id) => void runAction(id, "verify")}
                onReject={(row) => {
                  setRejectTarget(row);
                  setRejectReason("");
                }}
                onAdvance={(id) => void runAction(id, "advance")}
              />
            )}
          </main>
        </div>
      )}

      {rejectTarget && (
        <ModalShell
          title="Artwork not verified"
          icon={AlertTriangle}
          onClose={() => !busyId && setRejectTarget(null)}
          footer={
            <>
              <Button variant="outline" disabled={Boolean(busyId)} onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button disabled={Boolean(busyId)} className="gap-1" onClick={() => void submitReject()}>
                Send to exhibitor
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Explain why <strong>{rejectTarget.companyName}</strong>&apos;s artwork for{" "}
              <strong>{rejectTarget.itemName}</strong> could not be verified. The exhibitor will see
              this in their Brandings tab.
            </p>
            <div>
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g. Resolution too low, incorrect bleed, wrong dimensions…"
                className="mt-1"
              />
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function CompanyArtworkPanel({
  company,
  busyId,
  onVerify,
  onReject,
  onAdvance,
}: {
  company: CompanyGroup;
  busyId: string | null;
  onVerify: (id: string) => void;
  onReject: (row: AdminBrandingArtworkRecord) => void;
  onAdvance: (id: string) => void;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-5 border-b border-border pb-4">
        <h2 className="text-lg font-semibold">{company.companyName}</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {company.boothNumber ? `Booth #${company.boothNumber}` : "Booth TBC"}
            {company.hall ? ` · ${company.hall}` : ""}
          </span>
          {company.contactName ? <span>{company.contactName}</span> : null}
          {company.contactEmail ? (
            <a
              href={`mailto:${company.contactEmail}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {company.contactEmail}
            </a>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {company.submissions.map((row) => {
          const actions = printingStaffActionsFor(row.status);
          const busy = busyId === row.id;

          return (
            <article
              key={row.id}
              className="rounded-xl border border-border bg-muted/15 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{row.itemName}</h3>
                  <p className="text-xs text-muted-foreground">{row.itemCategory}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    BRANDING_ARTWORK_STATUS_BADGE[row.status]
                  )}
                >
                  {BRANDING_ARTWORK_STATUS_LABELS[row.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {row.originalFileName && row.cloudinaryPublicId ? (
                  <a
                    href={`/api/exhibitor/branding-artwork/${row.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {row.originalFileName}
                  </a>
                ) : (
                  <span>No file</span>
                )}
                {row.submittedAt ? (
                  <span>Submitted {formatDate(row.submittedAt, "MMM d, yyyy")}</span>
                ) : null}
              </div>

              {row.status === "NOT_VERIFIED" && row.rejectionReason ? (
                <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  Rejection note: {row.rejectionReason}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                {actions.canVerify ? (
                  <Button size="sm" className="h-8 gap-1 text-xs" disabled={busy} onClick={() => onVerify(row.id)}>
                    <Check className="h-3.5 w-3.5" /> Verified
                  </Button>
                ) : null}
                {actions.canReject ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => onReject(row)}
                  >
                    <X className="h-3.5 w-3.5" /> Not verified
                  </Button>
                ) : null}
                {actions.canAdvance && actions.nextStatus ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    disabled={busy}
                    onClick={() => onAdvance(row.id)}
                  >
                    Mark as {BRANDING_ARTWORK_STATUS_LABELS[actions.nextStatus].split(" —")[0]}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
