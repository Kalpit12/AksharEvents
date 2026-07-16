import {
  FLOOR_PLAN_LAYOUT_BY_CODE,
  STAND_TYPE_LABELS,
  type StandType,
} from "@/lib/floor-plan-layout";
import type { ExhibitorBoothPhase } from "@/lib/floor-plan-types";

export function standLabelForBoothCode(code: string): string | null {
  const layout = FLOOR_PLAN_LAYOUT_BY_CODE[code.toUpperCase()];
  return layout ? STAND_TYPE_LABELS[layout.standType] : null;
}

export function standTypeForBoothCode(code: string): StandType | null {
  const layout = FLOOR_PLAN_LAYOUT_BY_CODE[code.toUpperCase()];
  return layout?.standType ?? null;
}

/** Exhibitor-facing booth line e.g. "Booth D1 · D — Premium 5×6 m" */
export function formatExhibitorBoothLabel(
  boothNumber: string | null | undefined,
  hall?: string | null
): string {
  if (!boothNumber) return "Booth TBC";
  const code = boothNumber.trim().toUpperCase();
  const stand = standLabelForBoothCode(code);
  const parts = [`Booth ${code}`];
  if (stand) parts.push(stand);
  if (hall?.trim()) parts.push(hall.trim());
  return parts.join(" · ");
}

type BoothStatusValue = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "PREMIUM";

/** Resolve exhibitor booth lifecycle from EventExhibitor + EventBooth records. */
export function resolveExhibitorBoothPhase(input: {
  /** EventExhibitor.boothNumber — set when admin allocates */
  allocatedBoothNumber: string | null | undefined;
  /** Linked floor-plan booth, if any */
  linkedBooth?: {
    code: string;
    status: BoothStatusValue;
    paymentVerified: boolean;
  } | null;
}): {
  phase: ExhibitorBoothPhase;
  boothNumber: string | null;
  boothReservedCode: string | null;
} {
  const allocatedCode = input.allocatedBoothNumber?.trim().toUpperCase() || null;
  const linked = input.linkedBooth ?? null;
  const linkedCode = linked?.code?.trim().toUpperCase() || null;

  // Admin allocation writes boothNumber — authoritative even if booth row lagged on status.
  if (allocatedCode) {
    return {
      phase: "allocated",
      boothNumber: allocatedCode,
      boothReservedCode: null,
    };
  }

  if (linked?.status === "OCCUPIED" && linkedCode) {
    return {
      phase: "allocated",
      boothNumber: linkedCode,
      boothReservedCode: null,
    };
  }

  if (linked?.status === "RESERVED" && linkedCode) {
    return {
      phase: linked.paymentVerified ? "payment_verified" : "reserved",
      boothNumber: null,
      boothReservedCode: linkedCode,
    };
  }

  return {
    phase: "none",
    boothNumber: null,
    boothReservedCode: null,
  };
}
