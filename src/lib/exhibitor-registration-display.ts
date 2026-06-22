import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import {
  convertToKes,
  type TravelLogisticsForm,
} from "@/components/exhibitor-portal/registration-travel-step";
import { activityLabelMap } from "@/lib/exhibitor-form-options";
import type { EventActivityOption } from "@/lib/event-activity-types";

export type AdminExhibitorRecord = {
  id: string;
  companyName: string;
  slug: string;
  boothNumber: string | null;
  hall: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  products: string[];
  registrationStatus: "DRAFT" | "SUBMITTED" | null;
  submittedAt: string | null;
  formData: SavedRegistrationData | null;
};

export function registrationProgress(data: SavedRegistrationData | null): number {
  if (!data) return 0;
  let count = 0;
  if (data.formSteps.company) count++;
  if (data.formSteps.event) count++;
  if (data.members.length > 0) count++;
  if (data.formSteps.travel) count++;
  if (data.formSteps.transport) count++;
  if (data.formSteps.food) count++;
  return Math.round((count / 6) * 100);
}

export function formatTravelSummaryFromSaved(
  travel: TravelLogisticsForm,
  visaDocNames: SavedRegistrationData["visaDocNames"]
): [string, string][] {
  const flightLabels = { no: "No", one_way: "One-way", two_way: "Two-way" };
  const visaLabels = {
    already_have: "Already have visa",
    apply_myself: "Applying myself",
    need_help: "Need help",
  };
  const simLabels = { none: "Not needed", new_sim: "New SIM (recharged)", recharge_only: "Recharge only" };

  const rows: [string, string][] = [
    ["Flight ticket", flightLabels[travel.flightTicket]],
    ["Visa assistance", visaLabels[travel.visaHelp]],
  ];

  if (travel.visaHelp === "need_help") {
    rows.push(
      ["Passport uploaded", visaDocNames.passport ?? "Not uploaded"],
      ["ID uploaded", visaDocNames.id ?? "Not uploaded"],
      ["Yellow fever cert.", visaDocNames.yellowFever ?? "Not uploaded"]
    );
  }

  rows.push(["Hotel / accommodation", travel.hotel === "yes" ? "Yes" : "No"]);

  if (travel.hotel === "yes") {
    rows.push(["Airport ↔ hotel transfer", travel.airportHotelTransfer === "yes" ? "Yes" : "No"]);
    if (travel.airportHotelTransfer === "yes") {
      rows.push(
        ["Flight number", travel.flightNumber || "—"],
        ["Time of arrival", travel.arrivalTime ? new Date(travel.arrivalTime).toLocaleString() : "—"]
      );
    }
  }

  rows.push(["SIM", simLabels[travel.sim]]);

  const moneyExchange =
    travel.moneyExchange === "yes"
      ? (() => {
          const kes = convertToKes(travel.moneyExchangeAmount, travel.moneyExchangeCurrency);
          const base = travel.moneyExchangeAmount
            ? `${travel.moneyExchangeAmount} ${travel.moneyExchangeCurrency}`
            : "Yes (amount not specified)";
          return kes != null ? `${base} ≈ KES ${kes.toLocaleString()}` : base;
        })()
      : "No";

  rows.push(["Money exchange", moneyExchange], ["Daily venue transport", travel.dailyVenueTransport === "yes" ? "Yes" : "No"]);

  return rows;
}

export function tourLabelsFromIds(ids: string[], activities: EventActivityOption[] = []): string[] {
  const labels = activityLabelMap(activities);
  return ids.map((id) => labels.get(id) ?? id);
}

export function companyFormFields(data: SavedRegistrationData): [string, string][] {
  const { form } = data;
  return [
    ["Company / organisation", form.company || "—"],
    ["Industry / sector", form.industry || "—"],
    ["Contact person", form.contact || "—"],
    ["Job title", form.title || "—"],
    ["Email", form.email || "—"],
    ["Phone", form.phone || "—"],
    ["Country of origin", form.country || "—"],
    ["Staff attending", form.staff || "—"],
    ["Company description", form.desc || "—"],
  ];
}

export function eventFormFields(data: SavedRegistrationData): [string, string][] {
  const { form } = data;
  return [
    ["Booth size preference", form.booth || "—"],
    ["Booth setup date", form.setup || "—"],
    ["AV / presentation equipment", form.av || "—"],
    ["Accessibility / setup requirements", form.access || "—"],
  ];
}

export function transportFormFields(
  data: SavedRegistrationData,
  activities: EventActivityOption[] = []
): [string, string][] {
  const { form } = data;
  return [
    ["Accommodation pickup", form.accommodationPickup || "—"],
    ["Daily venue shuttles", data.shuttles.length > 0 ? data.shuttles.join(", ") : "None selected"],
    ["Tours selected", tourLabelsFromIds(data.selectedTours, activities).join(", ") || "None"],
    ["Departure & drop-off", form.depart || "—"],
    ["Vehicle preference", form.vehicle || "—"],
  ];
}

export function foodFormFields(data: SavedRegistrationData): [string, string][] {
  const { form } = data;
  return [
    ["Meal plan", "All vegetarian"],
    ["Team meals selected", data.selectedMeals.length > 0 ? data.selectedMeals.join("; ") : "None"],
    ["Dining experiences", data.selectedFoodExp.length > 0 ? data.selectedFoodExp.join("; ") : "None"],
    ["Allergies", form.allergy || "None"],
    ["Preferred meal style", form.mealstyle || "—"],
    ["Special food notes", form.foodnotes || "—"],
  ];
}
