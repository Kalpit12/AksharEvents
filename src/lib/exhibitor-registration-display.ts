import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import {
  convertToKes,
  KENYA_ETA_VISA_DOCUMENTS,
  type TravelLogisticsForm,
} from "@/components/exhibitor-portal/registration-travel-step";
import { activityLabelMap } from "@/lib/exhibitor-form-options";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { registrationProgress as sectionRegistrationProgress } from "@/lib/exhibitor-section-progress";

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
  /** Team member local IDs that have a badge photo on file */
  badgePhotoMemberIds: string[];
};

export function registrationProgress(data: SavedRegistrationData | null): number {
  return sectionRegistrationProgress(data);
}

export function formatTravelSummaryFromSaved(
  travel: TravelLogisticsForm,
  visaDocNames: SavedRegistrationData["visaDocNames"]
): [string, string][] {
  const flightLabels = { no: "No", one_way: "One-way", two_way: "Two-way" };
  const visaLabels = {
    already_have: "Already have eTA",
    apply_myself: "Applying myself",
    need_help: "Need help",
  };
  const simLabels = { none: "Not needed", new_sim: "New SIM (recharged)", recharge_only: "Recharge only" };

  const rows: [string, string][] = [
    ["Flight ticket", flightLabels[travel.flightTicket]],
    ["Kenya eTA assistance", visaLabels[travel.visaHelp]],
  ];

  if (travel.visaHelp === "need_help") {
    for (const doc of KENYA_ETA_VISA_DOCUMENTS) {
      const uploaded =
        visaDocNames[doc.key] ??
        (doc.key === "passportBioPage" ? visaDocNames.passport : null) ??
        (doc.key === "employerLetter" ? visaDocNames.id : null);
      rows.push([
        doc.label,
        uploaded ?? (doc.required ? "Not uploaded" : "Not uploaded (optional)"),
      ]);
    }
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

export function tourLabelsFromIds(
  ids: string[],
  activities: EventActivityOption[] = [],
  itineraries: Pick<SerializedTourTravelItinerary, "id" | "title">[] = []
): string[] {
  const labels = activityLabelMap(activities);
  for (const trip of itineraries) {
    labels.set(trip.id, trip.title);
  }
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
  const additionalCount = (
    data.selectedAdditionalItemIds ??
    data.selectedEquipmentIds ??
    []
  ).length;
  const fields: [string, string][] = [
    ["Booth package", form.booth || "—"],
    ["Booth setup date", form.setup || "—"],
    ["Accessibility / setup requirements", form.access || "—"],
  ];
  if (additionalCount > 0) {
    fields.push(["Additional requirements", `${additionalCount} item(s) selected`]);
  }
  return fields;
}

export function transportFormFields(
  data: SavedRegistrationData,
  activities: EventActivityOption[] = []
): [string, string][] {
  const { form } = data;
  return [
    ["Accommodation pickup", form.accommodationPickup || "—"],
    ["Tours selected", tourLabelsFromIds(data.selectedTours, activities).join(", ") || "None"],
    ["Departure & drop-off", form.depart || "—"],
    ["Vehicle", "Will be provided based on availability"],
  ];
}

export function foodFormFields(data: SavedRegistrationData): [string, string][] {
  const { form } = data;
  return [
    ["Meal plan", "All vegetarian"],
    ["Team meals selected", data.selectedMeals.length > 0 ? data.selectedMeals.join("; ") : "None"],
    ["Dining experiences", data.selectedFoodExp.length > 0 ? data.selectedFoodExp.join("; ") : "None"],
    ["Allergies", form.allergy || "None"],
    ["Special food notes", form.foodnotes || "—"],
  ];
}
