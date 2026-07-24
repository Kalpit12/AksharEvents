export type ExhibitorTab =
  | "overview"
  | "booth-members"
  | "booth-floor"
  | "booth-additional"
  | "booth-brandings"
  | "airport"
  | "accommodation"
  | "expo"
  | "tours"
  | "checkins"
  /** @deprecated Legacy tabs — redirected in dashboard */
  | "registration"
  | "booth"
  | "additional"
  | "brandings"
  | "members"
  | "food"
  | "schedules";

export type TeamMember = {
  id: string;
  fn: string;
  ln: string;
  role: string;
  email: string;
  phone: string;
  passportNumber?: string;
  /** Set when passport number is redacted from the client payload */
  hasPassportNumber?: boolean;
  transport: string;
  hotel: string;
  diet: string;
  tours: string;
  notes: string;
  portalAccess?: boolean;
  /** Per-member airport pick-up / drop-off answers */
  airportLogistics?: MemberAirportLogistics;
  /** Per-member accommodation answers */
  accommodationLogistics?: MemberAccommodationLogistics;
  /** Per-member expo shuttle answers */
  expoLogistics?: MemberExpoLogistics;
  /** Per-member tour selections */
  tourLogistics?: MemberTourLogistics;
};

export type MemberAirportLogistics = {
  answered: boolean;
  flightTicket: "no" | "one_way" | "two_way";
  visaHelp: "already_have" | "apply_myself" | "need_help";
  airportHotelTransfer: "yes" | "no";
  flightNumber: string;
  arrivalTime: string;
  sim: "none" | "new_sim" | "recharge_only";
  moneyExchange: "no" | "yes";
  moneyExchangeAmount: string;
  moneyExchangeCurrency: "USD" | "EUR" | "GBP";
  /** Filenames for Kenya eTA support documents (when visaHelp is need_help) */
  visaDocNames?: {
    passportBioPage: string | null;
    passportPhoto: string | null;
    returnTicket: string | null;
    accommodationProof: string | null;
    employerLetter: string | null;
    yellowFever: string | null;
  };
};

export type MemberAccommodationLogistics = {
  answered: boolean;
  needHotel: "yes" | "no";
  hotel: string;
};

export type MemberExpoLogistics = {
  answered: boolean;
  dailyShuttle: "yes" | "no";
};

export type MemberTourLogistics = {
  answered: boolean;
  selectedTourIds: string[];
  notes: string;
};

export const defaultMemberAirportVisaDocNames = (): NonNullable<
  MemberAirportLogistics["visaDocNames"]
> => ({
  passportBioPage: null,
  passportPhoto: null,
  returnTicket: null,
  accommodationProof: null,
  employerLetter: null,
  yellowFever: null,
});

export const defaultMemberAirportLogistics = (): MemberAirportLogistics => ({
  answered: false,
  flightTicket: "no",
  visaHelp: "already_have",
  airportHotelTransfer: "no",
  flightNumber: "",
  arrivalTime: "",
  sim: "none",
  moneyExchange: "no",
  moneyExchangeAmount: "",
  moneyExchangeCurrency: "USD",
  visaDocNames: defaultMemberAirportVisaDocNames(),
});

export const defaultMemberAccommodationLogistics = (): MemberAccommodationLogistics => ({
  answered: false,
  needHotel: "no",
  hotel: "",
});

export const defaultMemberExpoLogistics = (): MemberExpoLogistics => ({
  answered: false,
  dailyShuttle: "no",
});

export const defaultMemberTourLogistics = (): MemberTourLogistics => ({
  answered: false,
  selectedTourIds: [],
  notes: "",
});

export type AirBookingRequest = {
  id: string;
  ticketCount: number;
  travelDate: string;
  requestedAt: string;
  memberLocalIds?: string[];
  status?: "PENDING" | "SENT" | "CONFIRMED" | "CANCELLED";
  notes?: string | null;
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

export const VEHICLE_OPTIONS = ["Mini bus"] as const;

export const TRANSPORT_OPTIONS = ["Daily shuttle", "Bus A (airport)", "Safari van", "Own transport"] as const;

export const SHUTTLE_OPTIONS = ["Morning shuttle (07:30)", "Evening return (18:30)"] as const;

export const MEAL_STYLE_OPTIONS = ["Buffet", "Plated service", "Family style", "No preference"] as const;
