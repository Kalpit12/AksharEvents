import type {
  MemberAccommodationLogistics,
  MemberAirportLogistics,
  MemberExpoLogistics,
  MemberTourLogistics,
  TeamMember,
} from "@/components/exhibitor-portal/types";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";

export type SectionKey =
  | "booth"
  | "airport"
  | "accommodation"
  | "expo"
  | "tours";

export type SectionProgress = {
  key: SectionKey;
  label: string;
  done: number;
  total: number;
  pct: number;
  complete: boolean;
};

function memberAirportDone(m: TeamMember): boolean {
  return Boolean(m.airportLogistics?.answered);
}

function memberAccommodationDone(m: TeamMember): boolean {
  return Boolean(m.accommodationLogistics?.answered);
}

function memberExpoDone(m: TeamMember): boolean {
  return Boolean(m.expoLogistics?.answered);
}

function memberToursDone(m: TeamMember): boolean {
  return Boolean(m.tourLogistics?.answered);
}

export function boothSectionProgress(data: {
  members: TeamMember[];
  selectedAdditionalItemIds?: string[];
  brandingCount?: number;
  additionalReviewed?: boolean;
  brandingsReviewed?: boolean;
}): SectionProgress {
  const membersDone = data.members.length > 0 ? 1 : 0;
  const additionalDone =
    data.additionalReviewed || (data.selectedAdditionalItemIds?.length ?? 0) > 0 ? 1 : 0;
  const brandingsDone = data.brandingsReviewed || (data.brandingCount ?? 0) > 0 ? 1 : 0;
  const done = membersDone + additionalDone + brandingsDone;
  const total = 3;
  return {
    key: "booth",
    label: "Your Booth",
    done,
    total,
    pct: Math.round((done / total) * 100),
    complete: membersDone === 1 && additionalDone === 1 && brandingsDone === 1,
  };
}

export function memberWiseSectionProgress(
  key: Exclude<SectionKey, "booth">,
  label: string,
  members: TeamMember[],
  isDone: (m: TeamMember) => boolean
): SectionProgress {
  const total = Math.max(members.length, 1);
  const done = members.filter(isDone).length;
  const pct = members.length === 0 ? 0 : Math.round((done / members.length) * 100);
  return {
    key,
    label,
    done: members.length === 0 ? 0 : done,
    total: members.length === 0 ? 1 : total,
    pct,
    complete: members.length > 0 && done === members.length,
  };
}

export function computeSectionProgress(input: {
  members: TeamMember[];
  selectedAdditionalItemIds?: string[];
  brandingCount?: number;
  additionalReviewed?: boolean;
  brandingsReviewed?: boolean;
}): SectionProgress[] {
  return [
    boothSectionProgress(input),
    memberWiseSectionProgress("airport", "Airport pick up & drop off", input.members, memberAirportDone),
    memberWiseSectionProgress(
      "accommodation",
      "Accommodation",
      input.members,
      memberAccommodationDone
    ),
    memberWiseSectionProgress("expo", "Expo pick up & drop off", input.members, memberExpoDone),
    memberWiseSectionProgress("tours", "Tours", input.members, memberToursDone),
  ];
}

export function overallRegistrationPct(sections: SectionProgress[]): number {
  if (sections.length === 0) return 0;
  return Math.round(sections.reduce((sum, s) => sum + s.pct, 0) / sections.length);
}

export function registrationProgress(data: SavedRegistrationData | null): number {
  if (!data) return 0;
  const sections = computeSectionProgress({
    members: data.members ?? [],
    selectedAdditionalItemIds: data.selectedAdditionalItemIds,
    brandingCount: 0,
  });
  return overallRegistrationPct(sections);
}

/** Seed member airport logistics from legacy company-level travel form when missing. */
export function seedAirportFromTravel(
  travel: SavedRegistrationData["travel"] | undefined
): MemberAirportLogistics | undefined {
  if (!travel) return undefined;
  return {
    answered: false,
    flightTicket: travel.flightTicket,
    visaHelp: travel.visaHelp,
    airportHotelTransfer: travel.airportHotelTransfer,
    flightNumber: travel.flightNumber,
    arrivalTime: travel.arrivalTime,
    sim: travel.sim,
    moneyExchange: travel.moneyExchange,
    moneyExchangeAmount: travel.moneyExchangeAmount,
    moneyExchangeCurrency: travel.moneyExchangeCurrency,
  };
}

export function seedAccommodationFromTravel(
  travel: SavedRegistrationData["travel"] | undefined,
  hotel: string
): MemberAccommodationLogistics {
  return {
    answered: false,
    needHotel: travel?.hotel ?? (hotel ? "yes" : "no"),
    hotel: hotel || "",
  };
}

export function seedExpoFromTravel(
  travel: SavedRegistrationData["travel"] | undefined
): MemberExpoLogistics {
  return {
    answered: false,
    dailyShuttle: travel?.dailyVenueTransport ?? "no",
  };
}

export type { MemberAirportLogistics, MemberAccommodationLogistics, MemberExpoLogistics, MemberTourLogistics };
