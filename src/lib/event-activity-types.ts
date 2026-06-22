export type EventActivityOption = {
  id: string;
  kind: "TOUR" | "TRAVEL";
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  price: number;
  currency: string;
  maxSlots: number | null;
};
