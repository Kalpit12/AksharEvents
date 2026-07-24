import type { TravelLogisticsForm } from "@/components/exhibitor-portal/registration-travel-step";
import type { AirBookingRequest, TeamMember } from "@/components/exhibitor-portal/types";

export type RegistrationFormState = {
  company: string;
  industry: string;
  contact: string;
  title: string;
  email: string;
  phone: string;
  country: string;
  staff: string;
  desc: string;
  booth: string;
  setup: string;
  av: string;
  access: string;
  accommodationPickup: string;
  depart: string;
  vehicle: string;
  allergy: string;
  mealstyle: string;
  foodnotes: string;
};

export type RegistrationFormSteps = {
  company: boolean;
  event: boolean;
  travel: boolean;
  transport: boolean;
  food: boolean;
  /** New section registration flags */
  boothAdditional?: boolean;
  boothBrandings?: boolean;
};

export type SavedRegistrationData = {
  form: RegistrationFormState;
  travel: TravelLogisticsForm;
  visaDocNames: {
    passportBioPage: string | null;
    passportPhoto: string | null;
    returnTicket: string | null;
    accommodationProof: string | null;
    employerLetter: string | null;
    yellowFever: string | null;
    /** @deprecated Legacy saved registrations */
    passport?: string | null;
    id?: string | null;
  };
  members: TeamMember[];
  airBookingRequests?: AirBookingRequest[];
  selectedTours: string[];
  selectedMeals: string[];
  selectedFoodExp: string[];
  shuttles: string[];
  /** Item master — booth package (single) */
  selectedBoothItemId?: string | null;
  /** Item master — additional requirements (multi, all non-booth categories) */
  selectedAdditionalItemIds?: string[];
  /** @deprecated Migrated to selectedAdditionalItemIds */
  selectedEquipmentIds?: string[];
  formSteps: RegistrationFormSteps;
  regStep: number;
};
