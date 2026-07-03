"use client";

import { useMemo, useState } from "react";
import { useDashboardUrlState } from "@/hooks/use-dashboard-url-state";
import type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";
import type { EventActivityOption } from "@/lib/event-activity-types";
import {
  companyFormFields,
  eventFormFields,
  foodFormFields,
  formatTravelSummaryFromSaved,
  registrationProgress,
  transportFormFields,
} from "@/lib/exhibitor-registration-display";
import { AVATAR_COLORS, ROLE_BADGE } from "@/components/exhibitor-portal/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Building2,
  Bus,
  Calendar,
  ChevronRight,
  FileText,
  ForkKnife,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { AdminExhibitorBadgesSection } from "@/components/event-master/admin-exhibitor-badges-section";

function DetailGrid({ fields }: { fields: [string, string][] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {fields.map(([label, val]) => (
        <div key={label} className="rounded-lg bg-muted/50 p-3">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="text-sm font-medium whitespace-pre-wrap break-words">{val}</div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminExhibitorRecord["registrationStatus"] }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        Not started
      </span>
    );
  }
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
      Draft
    </span>
  );
}

function ExhibitorDetail({
  record,
  eventTitle,
  activities = [],
}: {
  record: AdminExhibitorRecord;
  eventTitle: string;
  activities?: EventActivityOption[];
}) {
  const data = record.formData;

  if (!data) {
    const profileFields: [string, string][] = [
      ["Company", record.companyName],
      ["Contact person", record.contactName ?? "—"],
      ["Email", record.contactEmail ?? "—"],
      ["Phone", record.contactPhone ?? "—"],
      ["Website", record.website ?? "—"],
      ["Products / services", record.products.length > 0 ? record.products.join(", ") : "—"],
      ["Booth", record.boothNumber ? `#${record.boothNumber}${record.hall ? ` · ${record.hall}` : ""}` : "TBC"],
    ];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{record.companyName}</h3>
            <p className="text-xs text-muted-foreground">Registration form not saved for this event yet</p>
          </div>
          <StatusBadge status={record.registrationStatus} />
        </div>
        <Section title="Exhibitor profile on file" icon={Building2}>
          <DetailGrid fields={profileFields} />
        </Section>
        <p className="text-center text-sm text-muted-foreground">
          Full registration details appear here once the exhibitor saves their form for this event.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{record.companyName}</h3>
          <p className="text-xs text-muted-foreground">
            {record.boothNumber ? `Booth #${record.boothNumber}${record.hall ? ` · ${record.hall}` : ""}` : "Booth TBC"}
            {record.submittedAt && ` · Submitted ${formatDate(record.submittedAt, "MMM d, yyyy h:mm a")}`}
          </p>
        </div>
        <StatusBadge status={record.registrationStatus} />
      </div>

      {record.products.length > 0 && (
        <Section title="Products & services" icon={Building2}>
          <p className="text-sm">{record.products.join(", ")}</p>
          {record.website && (
            <p className="mt-2 text-sm text-primary">{record.website}</p>
          )}
        </Section>
      )}

      <Section title="Company information" icon={Building2}>
        <DetailGrid fields={companyFormFields(data)} />
      </Section>

      <Section title="Event preferences & requirements" icon={Calendar}>
        <DetailGrid fields={eventFormFields(data)} />
      </Section>

      <Section title="Travel & logistics" icon={Bus}>
        <DetailGrid fields={formatTravelSummaryFromSaved(data.travel, data.visaDocNames)} />
      </Section>

      <Section title="Tours & transport" icon={MapPin}>
        <DetailGrid fields={transportFormFields(data, activities)} />
      </Section>

      <Section title="Food outings & dining" icon={ForkKnife}>
        <DetailGrid fields={foodFormFields(data)} />
      </Section>

      <Section title="Team members" icon={Users}>
        {data.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                  <th className="pb-2 pr-2">Name</th>
                  <th className="pb-2 pr-2">Role</th>
                  <th className="pb-2 pr-2">Email</th>
                  <th className="pb-2 pr-2">Transport</th>
                  <th className="pb-2 pr-2">Hotel</th>
                  <th className="pb-2 pr-2">Diet</th>
                  <th className="pb-2 pr-2">Tours</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m, i) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                            AVATAR_COLORS[i % AVATAR_COLORS.length]
                          )}
                        >
                          {(m.fn[0] + m.ln[0]).toUpperCase()}
                        </span>
                        {m.fn} {m.ln}
                      </div>
                    </td>
                    <td className="py-2.5 pr-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          ROLE_BADGE[m.role] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-xs text-muted-foreground">{m.email || "—"}</td>
                    <td className="py-2.5 pr-2 text-xs text-muted-foreground">{m.transport}</td>
                    <td className="py-2.5 pr-2 text-xs text-muted-foreground">{m.hotel}</td>
                    <td className="py-2.5 pr-2 text-xs text-muted-foreground">{m.diet || "—"}</td>
                    <td className="py-2.5 pr-2 text-xs text-muted-foreground">{m.tours}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{m.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <AdminExhibitorBadgesSection
        eventExhibitorId={record.id}
        eventTitle={eventTitle}
        members={data.members}
        badgePhotoMemberIds={record.badgePhotoMemberIds}
      />
    </div>
  );
}

type Props = {
  exhibitors: AdminExhibitorRecord[];
  eventTitle: string;
  activities?: EventActivityOption[];
};

export default function ExhibitorRegistrationsPanel({
  exhibitors,
  eventTitle,
  activities = [],
}: Props) {
  const [query, setQuery] = useState("");
  const { getParam, setParams } = useDashboardUrlState();
  const exhibitorParam = getParam("exhibitor");
  const selectedId = useMemo(() => {
    if (exhibitorParam && exhibitors.some((e) => e.id === exhibitorParam)) return exhibitorParam;
    return exhibitors[0]?.id ?? null;
  }, [exhibitorParam, exhibitors]);

  const selectExhibitor = (id: string) => setParams({ exhibitor: id });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exhibitors;
    return exhibitors.filter(
      (e) =>
        e.companyName.toLowerCase().includes(q) ||
        (e.contactName?.toLowerCase().includes(q) ?? false) ||
        (e.contactEmail?.toLowerCase().includes(q) ?? false)
    );
  }, [exhibitors, query]);

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  if (exhibitors.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold">No exhibitors yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Exhibitor registrations will appear here once companies are linked to this event.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Exhibitors ({filtered.length})</h3>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or contact…"
            className="h-9 pl-9"
          />
        </div>
        <ul className="max-h-[520px] space-y-1 overflow-y-auto">
          {filtered.map((record) => {
            const progress = registrationProgress(record.formData);
            const memberCount = record.formData?.members.length ?? 0;
            const active = selected?.id === record.id;
            return (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => selectExhibitor(record.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{record.companyName}</div>
                    <div className={cn("truncate text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {memberCount} member{memberCount === 1 ? "" : "s"} · {progress}% complete
                    </div>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 shrink-0", active ? "opacity-90" : "opacity-40")} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0 rounded-2xl border border-border bg-card p-5">
        {selected ? (
          <ExhibitorDetail record={selected} eventTitle={eventTitle} activities={activities} />
        ) : null}
      </div>
    </div>
  );
}
