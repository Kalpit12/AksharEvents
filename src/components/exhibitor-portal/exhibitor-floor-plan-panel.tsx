"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BOOTH_STATUS_COLORS,
  BOOTH_STATUS_LABELS,
  type BoothStatusValue,
} from "@/lib/floor-plan-layout";
import {
  cancelExhibitorBoothRequest,
  requestExhibitorBooth,
} from "@/lib/exhibitor-booth-actions";
import { startBoothPayPalCheckout } from "@/lib/booth-payment-actions";
import type {
  EventFloorPlanConfig,
  ExhibitorBoothPhase,
  FloorPlanBoothRecord,
} from "@/lib/floor-plan-types";
import { ModalShell } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, Clock, CreditCard, MapPin, ShieldCheck } from "lucide-react";

type Props = {
  eventExhibitorId: string;
  initialBooths: FloorPlanBoothRecord[];
  initialFloorPlan: EventFloorPlanConfig;
  initialPhase: ExhibitorBoothPhase;
  initialOwnBoothCode: string | null;
  hall?: string | null;
  paypalBoothCheckout?: {
    available: boolean;
    amount: number | null;
    currency: string | null;
    eventBoothId: string | null;
  };
};

const PHASE_COPY: Record<
  ExhibitorBoothPhase,
  { title: string; description: string; tone: string }
> = {
  none: {
    title: "Select your booth",
    description: "Click an available booth on the floor plan to reserve it for your company.",
    tone: "text-muted-foreground",
  },
  reserved: {
    title: "Booth reserved — awaiting payment",
    description:
      "Your selection is held as reserved. Admin will verify your payment, then allocate the booth.",
    tone: "text-amber-800 dark:text-amber-300",
  },
  payment_verified: {
    title: "Payment verified — allocation pending",
    description: "Payment is confirmed. Admin will allocate this booth to your company shortly.",
    tone: "text-sky-800 dark:text-sky-300",
  },
  allocated: {
    title: "Booth allocated",
    description: "Your booth is confirmed. Use these details for setup, badges, and on-site check-in.",
    tone: "text-emerald-800 dark:text-emerald-300",
  },
};

function isSelectable(status: BoothStatusValue, isOwn: boolean) {
  if (isOwn) return true;
  return status === "AVAILABLE" || status === "PREMIUM";
}

export default function ExhibitorFloorPlanPanel({
  eventExhibitorId,
  initialBooths,
  initialFloorPlan,
  initialPhase,
  initialOwnBoothCode,
  hall,
  paypalBoothCheckout,
}: Props) {
  const router = useRouter();
  const [booths, setBooths] = useState(initialBooths);
  const [floorPlan] = useState(initialFloorPlan);
  const [phase, setPhase] = useState(initialPhase);
  const [ownBoothCode, setOwnBoothCode] = useState(initialOwnBoothCode);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialOwnBoothCode);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReserveOpen, setConfirmReserveOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBooths(initialBooths);
    setPhase(initialPhase);
    setOwnBoothCode(initialOwnBoothCode);
    setSelectedCode(initialOwnBoothCode);
  }, [initialBooths, initialPhase, initialOwnBoothCode]);

  const selected = useMemo(
    () => booths.find((b) => b.code === selectedCode) ?? null,
    [booths, selectedCode]
  );

  const copy = PHASE_COPY[phase];
  const boothDisplayLabel = (code: string) =>
    hall?.trim() ? `Booth ${code} · ${hall.trim()}` : `Booth ${code}`;

  const selectBooth = useCallback(
    (code: string) => {
      const booth = booths.find((b) => b.code === code);
      if (!booth) return;
      const isOwn = booth.eventExhibitorId === eventExhibitorId;
      if (!isSelectable(booth.status, isOwn) && phase !== "allocated") {
        setMessage(
          booth.status === "RESERVED"
            ? `Booth ${booth.code} is reserved${booth.companyName ? ` by ${booth.companyName}` : ""}.`
            : `Booth ${booth.code} is not available.`
        );
        return;
      }
      setSelectedCode(code);
      setMessage(null);
    },
    [booths, eventExhibitorId, phase]
  );

  const requestBooth = () => {
    if (!selectedCode) {
      setMessage("Select an available booth on the plan first.");
      return;
    }
    if (phase === "allocated") {
      setMessage("Your booth is already allocated. Contact admin to change it.");
      return;
    }

    startTransition(async () => {
      const result = await requestExhibitorBooth({
        eventExhibitorId,
        boothCode: selectedCode,
      });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      setBooths((current) =>
        current.map((b) => {
          if (b.eventExhibitorId === eventExhibitorId && b.code !== selectedCode) {
            return {
              ...b,
              status: b.status === "RESERVED" ? "AVAILABLE" : b.status,
              eventExhibitorId: null,
              exhibitorName: null,
              companyName: null,
              reservedAt: null,
              paymentVerified: false,
              paymentVerifiedAt: null,
            };
          }
          if (b.code === selectedCode) {
            return {
              ...b,
              status: "RESERVED",
              eventExhibitorId,
              reservedAt: new Date().toISOString(),
              paymentVerified: false,
              paymentVerifiedAt: null,
            };
          }
          return b;
        })
      );
      setOwnBoothCode(selectedCode);
      setPhase("reserved");
      setConfirmReserveOpen(false);
      setMessage(`Booth ${selectedCode} reserved. Complete payment so admin can allocate it.`);
      router.refresh();
    });
  };

  const openReserveConfirm = () => {
    if (!selectedCode) {
      setMessage("Select an available booth on the plan first.");
      return;
    }
    if (phase === "allocated") {
      setMessage("Your booth is already allocated. Contact admin to change it.");
      return;
    }
    setConfirmReserveOpen(true);
  };

  const isSwitchingReservation = Boolean(ownBoothCode && selectedCode && ownBoothCode !== selectedCode);

  const cancelRequest = () => {
    startTransition(async () => {
      const result = await cancelExhibitorBoothRequest({ eventExhibitorId });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setBooths((current) =>
        current.map((b) => {
          if (b.eventExhibitorId !== eventExhibitorId) return b;
          return {
            ...b,
            status: "AVAILABLE",
            eventExhibitorId: null,
            exhibitorName: null,
            companyName: null,
            reservedAt: null,
            paymentVerified: false,
            paymentVerifiedAt: null,
          };
        })
      );
      setOwnBoothCode(null);
      setPhase("none");
      setMessage("Booth reservation cancelled.");
      router.refresh();
    });
  };

  const payWithPayPal = () => {
    const boothId = paypalBoothCheckout?.eventBoothId;
    if (!boothId) {
      setMessage("PayPal checkout is not available for this booth.");
      return;
    }
    startTransition(async () => {
      const result = await startBoothPayPalCheckout(boothId);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      if ("checkoutUrl" in result && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    });
  };

  const showPaypalPay =
    phase === "reserved" &&
    Boolean(paypalBoothCheckout?.available && paypalBoothCheckout.eventBoothId);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border border-border px-4 py-3",
          phase === "allocated" && "border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20",
          phase === "reserved" && "border-amber-300 bg-amber-50/80 dark:bg-amber-950/20",
          phase === "payment_verified" && "border-sky-300 bg-sky-50/80 dark:bg-sky-950/20"
        )}
      >
        <div className="flex flex-wrap items-start gap-3">
          {phase === "allocated" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : phase === "payment_verified" ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          ) : phase === "reserved" ? (
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", copy.tone)}>{copy.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{copy.description}</p>
            {phase === "allocated" && ownBoothCode ? (
              <p className="mt-2 text-sm font-medium text-foreground">
                {boothDisplayLabel(ownBoothCode)}
              </p>
            ) : ownBoothCode && phase !== "none" ? (
              <p className="mt-2 text-sm font-medium text-foreground">
                Selected booth: {ownBoothCode}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-white sm:min-h-[420px]">
          <svg
            viewBox={`0 0 ${floorPlan.viewBox.width} ${floorPlan.viewBox.height}`}
            className="absolute inset-0 h-full w-full select-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Exhibition floor plan — select a booth"
          >
            <image
              href={floorPlan.imageUrl}
              x={0}
              y={0}
              width={floorPlan.viewBox.width}
              height={floorPlan.viewBox.height}
              preserveAspectRatio="xMidYMid meet"
            />
            {booths.map((booth) => {
              const isSelected = booth.code === selectedCode;
              const isOwn = booth.eventExhibitorId === eventExhibitorId;
              const isAllocatedOwn = phase === "allocated" && booth.code === ownBoothCode;
              const displayStatus = isAllocatedOwn ? "OCCUPIED" : booth.status;
              const selectable = phase !== "allocated" && isSelectable(booth.status, isOwn);
              const fill = BOOTH_STATUS_COLORS[displayStatus];
              return (
                <rect
                  key={booth.code}
                  x={booth.x}
                  y={booth.y}
                  width={booth.w}
                  height={booth.h}
                  fill={fill}
                  fillOpacity={isSelected || isOwn ? 0.55 : 0.22}
                  stroke={isOwn ? "#059669" : isSelected ? "#6f5cff" : "transparent"}
                  strokeWidth={isOwn || isSelected ? 3 : 0}
                  rx={2}
                  className={selectable ? "cursor-pointer" : "cursor-default"}
                  onClick={() => selectBooth(booth.code)}
                >
                  <title>
                    {`${booth.code} — ${BOOTH_STATUS_LABELS[displayStatus]}${
                      booth.companyName ? ` · ${booth.companyName}` : ""
                    }`}
                  </title>
                </rect>
              );
            })}
          </svg>
        </div>

        <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2.5 text-xs text-muted-foreground">
            {(Object.keys(BOOTH_STATUS_LABELS) as BoothStatusValue[]).map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded border border-black/15"
                  style={{ background: BOOTH_STATUS_COLORS[key] }}
                />
                {BOOTH_STATUS_LABELS[key]}
              </span>
            ))}
          </div>

          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Click an available (green) or premium (blue) booth to select it.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-semibold">Booth {selected.code}</p>
                <p className="mt-1 text-sm">
                  Status:{" "}
                  <span className="font-medium">
                    {phase === "allocated" && selected.code === ownBoothCode
                      ? BOOTH_STATUS_LABELS.OCCUPIED
                      : phase === "payment_verified" &&
                          selected.code === ownBoothCode &&
                          selected.status === "RESERVED"
                        ? "Payment verified (allocation pending)"
                        : BOOTH_STATUS_LABELS[selected.status]}
                  </span>
                  {selected.companyName ? ` · ${selected.companyName}` : null}
                </p>
              </div>

              {phase === "allocated" ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  This booth is allocated to your company. Contact admin if you need a change.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selected.eventExhibitorId === eventExhibitorId && phase === "reserved" ? (
                    <>
                      {showPaypalPay ? (
                        <Button type="button" onClick={payWithPayPal} disabled={pending}>
                          <CreditCard className="mr-1.5 h-4 w-4" />
                          {pending
                            ? "Redirecting…"
                            : `Pay with PayPal${
                                paypalBoothCheckout?.amount != null && paypalBoothCheckout.currency
                                  ? ` · ${paypalBoothCheckout.currency} ${paypalBoothCheckout.amount}`
                                  : ""
                              }`}
                        </Button>
                      ) : null}
                      <Button type="button" variant="outline" onClick={cancelRequest} disabled={pending}>
                        {pending ? "Cancelling…" : "Cancel reservation"}
                      </Button>
                    </>
                  ) : null}
                  {(selected.status === "AVAILABLE" ||
                    selected.status === "PREMIUM" ||
                    (selected.eventExhibitorId === eventExhibitorId && phase === "reserved")) &&
                  selected.code !== ownBoothCode ? (
                    <Button type="button" onClick={openReserveConfirm} disabled={pending}>
                      {pending
                        ? "Reserving…"
                        : ownBoothCode
                          ? `Switch reservation to ${selected.code}`
                          : `Reserve booth ${selected.code}`}
                    </Button>
                  ) : selected.code === ownBoothCode && phase === "payment_verified" ? (
                    <p className="text-sm text-muted-foreground">
                      Payment verified. Admin will allocate this booth shortly.
                    </p>
                  ) : selected.code === ownBoothCode && phase === "reserved" ? (
                    <p className="text-sm text-muted-foreground">
                      This is your current reservation. Complete payment for admin to allocate it.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {message ? (
            <p
              className={cn(
                "mt-3 text-center text-sm",
                message.toLowerCase().includes("reserved") || message.toLowerCase().includes("cancelled")
                  ? "text-emerald-600"
                  : "text-muted-foreground"
              )}
            >
              {message}
            </p>
          ) : null}
        </aside>
      </div>

      {confirmReserveOpen && selected ? (
        <ModalShell
          title={isSwitchingReservation ? "Confirm booth change" : "Confirm booth selection"}
          icon={Building2}
          onClose={() => !pending && setConfirmReserveOpen(false)}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirmReserveOpen(false)}
              >
                Go back
              </Button>
              <Button type="button" disabled={pending} onClick={requestBooth}>
                {pending
                  ? "Reserving…"
                  : isSwitchingReservation
                    ? "Yes, change my reservation"
                    : "Yes, reserve this booth"}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Please review the details below and confirm that this is the booth you would like to
              reserve for your company.
            </p>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-lg font-semibold text-foreground">Booth {selected.code}</p>
              <p className="mt-2 text-foreground">
                Status:{" "}
                <span className="font-medium">
                  {selected.status === "PREMIUM" ? "Premium — available" : "Available"}
                </span>
              </p>
            </div>

            {isSwitchingReservation ? (
              <p className="text-muted-foreground">
                Your current reservation is booth <strong>{ownBoothCode}</strong>. Confirming will
                release that hold and reserve booth <strong>{selected.code}</strong> instead.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Once reserved, admin will verify your payment before final allocation. You may
                cancel your reservation before payment is confirmed, subject to availability.
              </p>
            )}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
