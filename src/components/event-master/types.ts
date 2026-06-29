export type EventMasterMember = {
  id: string;
  fn: string;
  ln: string;
  role: string;
  food: string;
  transport: string;
  hotel: string;
};

export type EventMasterTab =
  | "exhibitors"
  | "members"
  | "flights"
  | "supplies"
  | "items"
  | "transport"
  | "hotels"
  | "food"
  | "schedule";

export type { AdminExhibitorRecord } from "@/lib/exhibitor-registration-display";

export const ROLE_BADGE: Record<string, string> = {
  Speaker: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Attendee: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Organizer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  VIP: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Lead exhibitor": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Sales rep": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Technical staff": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Marketing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Executive: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Support: "bg-muted text-muted-foreground",
};

export const AVATAR_COLORS = [
  "bg-teal-100 text-teal-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
];
