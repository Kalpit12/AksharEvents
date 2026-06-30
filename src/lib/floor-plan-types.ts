import type { BoothStatusValue, StandType } from "@/lib/floor-plan-layout";

export type FloorPlanBoothRecord = {
  id: string;
  code: string;
  standType: StandType;
  x: number;
  y: number;
  w: number;
  h: number;
  status: BoothStatusValue;
  eventExhibitorId: string | null;
  exhibitorName: string | null;
  companyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
};
