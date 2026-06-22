export type ExhibitorTab = "overview" | "registration" | "members" | "tours" | "food";

export type TeamMember = {
  id: string;
  fn: string;
  ln: string;
  role: string;
  email: string;
  transport: string;
  hotel: string;
  diet: string;
  tours: string;
  notes: string;
};

export const MEMBER_ROLES = [
  "Lead exhibitor",
  "Sales rep",
  "Technical staff",
  "Marketing",
  "Executive",
  "Support",
] as const;

export const ROLE_BADGE: Record<string, string> = {
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

export const BOOTH_SIZE_OPTIONS = ["3×3 m", "3×2 m", "2×3 m"] as const;

export const AV_OPTIONS = ["No", "Yes — projector & screen", "Yes — TV display", "Yes — full AV setup"] as const;

export const VEHICLE_OPTIONS = ["Standard minibus", "Safari van", "Private car", "No preference"] as const;

export const TRANSPORT_OPTIONS = ["Daily shuttle", "Bus A (airport)", "Safari van", "Own transport"] as const;

export const SHUTTLE_OPTIONS = ["Morning shuttle (07:30)", "Evening return (18:30)"] as const;

export const MEAL_STYLE_OPTIONS = ["Buffet", "Plated service", "Family style", "No preference"] as const;
