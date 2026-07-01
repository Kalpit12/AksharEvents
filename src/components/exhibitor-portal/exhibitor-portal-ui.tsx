"use client";

import Ferrofluid from "@/components/ferrofluid/Ferrofluid";
import { HERO_FERROFLUID } from "@/lib/hero-ferrofluid";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, CheckCircle2, Circle, MapPin, Sparkles, X } from "lucide-react";

export type PortalHeroStatus = "not_linked" | "draft" | "submitted";

function getEventCountdown(startDate: string, endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today > end) {
    return { kind: "ended" as const };
  }
  if (today >= start) {
    const day = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
    return { kind: "live" as const, day };
  }
  const days = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
  return { kind: "upcoming" as const, days };
}

const STATUS_STYLES: Record<PortalHeroStatus, string> = {
  not_linked: "border-amber-300/30 bg-amber-500/20 text-amber-100",
  draft: "border-champagne/20 bg-champagne/25 text-champagne-light",
  submitted: "border-emerald-300/30 bg-emerald-500/20 text-emerald-100",
};

const STATUS_LABELS: Record<PortalHeroStatus, string> = {
  not_linked: "Awaiting event selection",
  draft: "Draft — not submitted",
  submitted: "Registration submitted",
};

export function PortalHero({
  eventTitle,
  eventCity,
  dateRange,
  companyName,
  boothLabel,
  eventVenue,
  startDate,
  endDate,
  status,
  actionLabel,
  onAction,
  headerActions,
}: {
  eventTitle: string;
  eventCity: string;
  dateRange: string;
  companyName: string;
  boothLabel: string;
  eventVenue: string;
  startDate: string;
  endDate: string;
  status: PortalHeroStatus;
  actionLabel: string;
  onAction: () => void;
  headerActions?: React.ReactNode;
}) {
  const countdown = getEventCountdown(startDate, endDate);

  return (
    <div className="relative min-h-[172px] overflow-hidden rounded-2xl border border-champagne/30 bg-espresso text-alabaster shadow-lg shadow-espresso/10 sm:min-h-[188px]">
      <Ferrofluid {...HERO_FERROFLUID} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-espresso/82 via-espresso/58 to-champagne-dark/38" />

      <div className="relative z-10 flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
        {headerActions ? (
          <div className="absolute right-5 top-5 z-20 sm:right-7 sm:top-7">{headerActions}</div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-alabaster/10 bg-alabaster/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Exhibitor Portal
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-[1.65rem]">{eventTitle}</h1>
          <p className="mt-1 text-sm text-champagne-light/75">
            {eventCity} · {dateRange}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-alabaster/10 bg-alabaster/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
              {companyName}
            </span>
            <span className="rounded-lg border border-alabaster/5 bg-alabaster/10 px-3 py-1.5 text-xs text-champagne-light/70">
              {boothLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                STATUS_STYLES[status]
              )}
            >
              {status === "draft" ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne-light" />
              ) : status === "submitted" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : null}
              {STATUS_LABELS[status]}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-4 rounded-2xl border border-alabaster/10 bg-alabaster/10 p-4 backdrop-blur-md sm:min-w-[240px] lg:min-w-[260px]">
          <div className="text-center lg:text-left">
            {countdown.kind === "upcoming" ? (
              <>
                <div className="text-3xl font-bold tabular-nums tracking-tight">{countdown.days}</div>
                <div className="text-xs text-champagne-light/70">
                  {countdown.days === 1 ? "day until event" : "days until event"}
                </div>
              </>
            ) : countdown.kind === "live" ? (
              <>
                <div className="text-3xl font-bold tabular-nums tracking-tight">Day {countdown.day}</div>
                <div className="text-xs text-champagne-light/70">Event in progress</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold tracking-tight">Event completed</div>
                <div className="text-xs text-champagne-light/70">Thank you for exhibiting</div>
              </>
            )}
          </div>

          <div className="space-y-1.5 border-t border-alabaster/10 pt-3 text-xs text-champagne-light/80">
            {eventVenue ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne-light/60" />
                <span className="line-clamp-2">{eventVenue}</span>
              </div>
            ) : null}
            <div className="pl-5 text-champagne-light/60">{boothLabel}</div>
          </div>

          <Button
            type="button"
            onClick={onAction}
            className="w-full gap-2 bg-champagne text-espresso shadow-md hover:bg-champagne-light"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "teal" | "emerald" | "violet" | "amber" | "sky";
}) {
  const accents = {
    teal: {
      card: "from-champagne/10 to-champagne/5 border-champagne/30 dark:border-champagne/20",
      icon: "text-primary",
    },
    emerald: {
      card: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/60 dark:border-emerald-800/40",
      icon: "text-emerald-600",
    },
    violet: {
      card: "from-violet-500/10 to-violet-600/5 border-violet-200/60 dark:border-violet-800/40",
      icon: "text-violet-600",
    },
    amber: {
      card: "from-amber-500/10 to-amber-600/5 border-amber-200/60 dark:border-amber-800/40",
      icon: "text-amber-600",
    },
    sky: {
      card: "from-sky-500/10 to-sky-600/5 border-sky-200/60 dark:border-sky-800/40",
      icon: "text-sky-600",
    },
  };

  const style = accents[accent];

  return (
    <div className={cn("group rounded-xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-md", style.card)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 shadow-sm", style.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

export function PortalNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="min-w-0">
      {/* Mobile: horizontal scroll — full width above main grid */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                active === id
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:border-champagne/30 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: sidebar */}
      <nav className="hidden lg:block lg:w-full">
        <div className="sticky top-24 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                active === id
                  ? "bg-primary font-medium text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Panel({
  title,
  icon: Icon,
  children,
  action,
  noHeader,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  noHeader?: boolean;
  className?: string;
}) {
  if (noHeader) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
        {children}
      </div>
    );
  }
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 text-champagne-dark dark:bg-champagne/15 dark:text-champagne-light">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

export function ChecklistItem({ label, done, onAction }: { label: string; done: boolean; onAction?: () => void }) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        done ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20" : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-center gap-2.5">
        {done ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      </div>
      {!done && onAction && (
        <button type="button" onClick={onAction} className="shrink-0 text-xs font-medium text-primary hover:text-champagne-dark">
          Complete
        </button>
      )}
    </li>
  );
}

export function GlanceRow({
  icon: Icon,
  title,
  sub,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex items-start gap-3 rounded-xl border p-3 text-sm last:mb-0",
        warn ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20" : "border-border/60 bg-muted/20"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          warn ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40" : "bg-champagne/15 text-champagne-dark dark:bg-champagne/15 dark:text-champagne-light"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className={cn("font-medium", warn && "text-amber-800 dark:text-amber-300")}>{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

export function StepBar({ step, onStepClick }: { step: number; onStepClick?: (n: number) => void }) {
  const steps = ["Company", "Event", "Travel", "Tours", "Food", "Review"];
  return (
    <div className="mb-6 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      <div className="flex min-w-[min(100%,420px)] items-center gap-0 sm:min-w-[540px]">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!onStepClick}
                onClick={() => onStepClick?.(n)}
                className={cn("flex items-center gap-2 rounded-lg px-1 py-1 transition-colors", onStepClick && "hover:bg-muted/60")}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                    active && "border-primary bg-primary text-white shadow-md shadow-primary/25",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    !active && !done && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <span className={cn("hidden text-xs sm:inline", active && "font-semibold text-foreground", done && "text-emerald-700 dark:text-emerald-400")}>
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn("mx-1 h-0.5 flex-1 rounded-full transition-colors", done ? "bg-emerald-400" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title?: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-8" : "py-12")}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      {title && <p className="mb-1 font-medium text-foreground">{title}</p>}
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ModalShell({
  title,
  icon: Icon,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 backdrop-blur-sm sm:pt-16">
      <div className={cn("w-full rounded-2xl border border-border bg-card shadow-2xl", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/15 text-champagne-dark dark:bg-champagne/15 dark:text-champagne-light">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>
      </div>
    </div>
  );
}

export function QuickAction({
  label,
  sub,
  onClick,
  highlight,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-w-[160px] flex-1 flex-col rounded-xl border px-4 py-3.5 text-left transition-all sm:min-w-0",
        highlight
          ? "border-primary bg-champagne/10 shadow-sm dark:border-champagne-dark dark:bg-espresso/30"
          : "border-border bg-muted/20 hover:border-champagne hover:bg-champagne/10 dark:hover:border-champagne/20 dark:hover:bg-champagne/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={cn("text-sm font-medium", highlight && "text-espresso dark:text-champagne-light")}>{label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <ArrowRight
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
            highlight ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )}
        />
      </div>
    </button>
  );
}

export function QuickActionsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {children}
    </div>
  );
}

export function ContinueButton({ onClick, label = "Continue registration" }: { onClick: () => void; label?: string }) {
  return (
    <Button onClick={onClick} className="mt-4 w-full gap-2 bg-primary shadow-md shadow-primary/20 hover:bg-champagne-dark">
      {label} <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
