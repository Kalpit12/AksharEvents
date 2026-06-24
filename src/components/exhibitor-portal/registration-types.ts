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
};

export type SavedRegistrationData = {
  form: RegistrationFormState;
  travel: TravelLogisticsForm;
  visaDocNames: {
    passport: string | null;
    id: string | null;
    yellowFever: string | null;
  };
  members: TeamMember[];
  airBookingRequests?: AirBookingRequest[];
  selectedTours: string[];
  selectedMeals: string[];
  selectedFoodExp: string[];
  shuttles: string[];
  formSteps: RegistrationFormSteps;
  regStep: number;
};
