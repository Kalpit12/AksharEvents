import {
  FLOOR_PLAN_LAYOUT_BY_CODE,
  STAND_TYPE_LABELS,
  type StandType,
} from "@/lib/floor-plan-layout";

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
