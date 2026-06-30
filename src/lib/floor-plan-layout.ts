/** Static booth geometry aligned to public/FLOOR PLAN.jpeg (viewBox 1600×895). */

export const FLOOR_PLAN_IMAGE = "/FLOOR%20PLAN.jpeg";
export const FLOOR_PLAN_VIEWBOX = { width: 1600, height: 895 } as const;

export type StandType = "A" | "B" | "C" | "D";

export type FloorPlanBoothLayout = {
  code: string;
  standType: StandType;
  x: number;
  y: number;
  w: number;
  h: number;
  defaultStatus?: "PREMIUM";
};

const RAW_BOOTHS: Omit<FloorPlanBoothLayout, "standType">[] = [
  { code: "C3", x: 55, y: 50, w: 100, h: 100 },
  { code: "A8", x: 155, y: 50, w: 95, h: 100 },
  { code: "A7", x: 250, y: 50, w: 95, h: 100 },
  { code: "A6", x: 345, y: 50, w: 95, h: 100 },
  { code: "A5", x: 440, y: 50, w: 95, h: 100 },
  { code: "B3", x: 535, y: 50, w: 120, h: 100 },
  { code: "B2", x: 760, y: 50, w: 125, h: 100 },
  { code: "A4", x: 885, y: 50, w: 95, h: 100 },
  { code: "A3", x: 980, y: 50, w: 95, h: 100 },
  { code: "A2", x: 1075, y: 50, w: 95, h: 100 },
  { code: "A1", x: 1170, y: 145, w: 90, h: 95 },
  { code: "B1", x: 1260, y: 145, w: 95, h: 125 },
  { code: "A9", x: 60, y: 238, w: 95, h: 90 },
  { code: "A10", x: 60, y: 330, w: 95, h: 92 },
  { code: "A11", x: 60, y: 424, w: 95, h: 94 },
  { code: "A12", x: 60, y: 520, w: 95, h: 94 },
  { code: "A13", x: 250, y: 225, w: 92, h: 95 },
  { code: "A14", x: 342, y: 225, w: 94, h: 95 },
  { code: "A15", x: 436, y: 225, w: 94, h: 95 },
  { code: "B4", x: 530, y: 225, w: 125, h: 95 },
  { code: "A18", x: 250, y: 330, w: 92, h: 94 },
  { code: "A19", x: 342, y: 330, w: 94, h: 94 },
  { code: "A20", x: 436, y: 330, w: 94, h: 94 },
  { code: "B6", x: 530, y: 330, w: 125, h: 94 },
  { code: "B5", x: 760, y: 225, w: 125, h: 95 },
  { code: "A16", x: 885, y: 225, w: 92, h: 95 },
  { code: "A17", x: 977, y: 225, w: 94, h: 95 },
  { code: "B7", x: 760, y: 330, w: 125, h: 94 },
  { code: "A21", x: 885, y: 330, w: 92, h: 94 },
  { code: "A22", x: 977, y: 330, w: 94, h: 94 },
  { code: "A23", x: 1071, y: 330, w: 94, h: 94 },
  { code: "A24", x: 250, y: 520, w: 92, h: 94 },
  { code: "A25", x: 342, y: 520, w: 94, h: 94 },
  { code: "A26", x: 436, y: 520, w: 94, h: 94 },
  { code: "B8", x: 530, y: 520, w: 125, h: 94 },
  { code: "B9", x: 760, y: 520, w: 125, h: 94 },
  { code: "A27", x: 885, y: 520, w: 92, h: 94 },
  { code: "A28", x: 977, y: 520, w: 94, h: 94 },
  { code: "A29", x: 1071, y: 520, w: 94, h: 94 },
  { code: "C2", x: 60, y: 695, w: 95, h: 95 },
  { code: "A30", x: 155, y: 695, w: 95, h: 95 },
  { code: "A31", x: 250, y: 695, w: 92, h: 95 },
  { code: "A32", x: 342, y: 695, w: 94, h: 95 },
  { code: "A33", x: 436, y: 695, w: 94, h: 95 },
  { code: "B10", x: 530, y: 695, w: 125, h: 95 },
  { code: "B11", x: 760, y: 695, w: 125, h: 95 },
  { code: "A34", x: 885, y: 695, w: 92, h: 95 },
  { code: "A35", x: 977, y: 695, w: 94, h: 95 },
  { code: "A36", x: 1071, y: 695, w: 94, h: 95 },
  { code: "A37", x: 1165, y: 695, w: 94, h: 95 },
  { code: "C1", x: 1259, y: 695, w: 95, h: 95 },
  { code: "D1", x: 1456, y: 323, w: 126, h: 212, defaultStatus: "PREMIUM" },
];

function standTypeFromCode(code: string): StandType {
  const letter = code.charAt(0).toUpperCase();
  if (letter === "A" || letter === "B" || letter === "C" || letter === "D") return letter;
  return "A";
}

export const FLOOR_PLAN_BOOTHS: FloorPlanBoothLayout[] = RAW_BOOTHS.map((booth) => ({
  ...booth,
  standType: standTypeFromCode(booth.code),
}));

export const FLOOR_PLAN_LAYOUT_BY_CODE = Object.fromEntries(
  FLOOR_PLAN_BOOTHS.map((b) => [b.code, b])
) as Record<string, FloorPlanBoothLayout>;

export const STAND_TYPE_LABELS: Record<StandType, string> = {
  A: "A — 3×3 m",
  B: "B — 4×3 m",
  C: "C — 6×3 m",
  D: "D — Premium 5×6 m",
};

export type BoothStatusValue = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "PREMIUM";

export const BOOTH_STATUS_LABELS: Record<BoothStatusValue, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  OCCUPIED: "Occupied",
  PREMIUM: "Premium",
};

export const BOOTH_STATUS_COLORS: Record<BoothStatusValue, string> = {
  AVAILABLE: "#b7f7c2",
  RESERVED: "#ffe08a",
  OCCUPIED: "#ff9b9b",
  PREMIUM: "#a9d6ff",
};
