import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import {
  tourLabelsFromIds,
  type AdminExhibitorRecord,
} from "@/lib/exhibitor-registration-display";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";

export type TourTravelExhibitorSelection = {
  eventExhibitorId: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  boothNumber: string | null;
  registrationStatus: "DRAFT" | "SUBMITTED" | null;
  memberCount: number;
  tours: string[];
  shuttles: string[];
  accommodationPickup: string | null;
  departure: string | null;
};

export function exhibitorHasToursAndTravelsSelection(
  formData: SavedRegistrationData | null | undefined
): boolean {
  if (!formData) return false;
  if (formData.selectedTours.length > 0) return true;
  if (formData.members.some((m) => (m.tourLogistics?.selectedTourIds.length ?? 0) > 0)) {
    return true;
  }
  if (formData.shuttles.length > 0) return true;
  if (formData.form.accommodationPickup?.toLowerCase().startsWith("yes")) return true;
  if (formData.form.depart && !formData.form.depart.toLowerCase().startsWith("no")) return true;
  return false;
}

export function aggregateTourTravelExhibitorSelections(
  exhibitors: AdminExhibitorRecord[],
  activities: EventActivityOption[] = [],
  itineraries: Pick<SerializedTourTravelItinerary, "id" | "title">[] = []
): TourTravelExhibitorSelection[] {
  return exhibitors
    .filter((record) => exhibitorHasToursAndTravelsSelection(record.formData))
    .map((record) => {
      const data = record.formData!;
      const memberTourIds = data.members.flatMap((m) => m.tourLogistics?.selectedTourIds ?? []);
      const allTourIds = [...new Set([...data.selectedTours, ...memberTourIds])];
      return {
        eventExhibitorId: record.id,
        companyName: record.companyName,
        contactName: record.contactName,
        contactEmail: record.contactEmail,
        boothNumber: record.boothNumber,
        registrationStatus: record.registrationStatus,
        memberCount: Math.max(data.members.length, Number(data.form.staff) || 0),
        tours: tourLabelsFromIds(allTourIds, activities, itineraries),
        shuttles: [...data.shuttles],
        accommodationPickup: data.form.accommodationPickup || null,
        departure: data.form.depart || null,
      };
    });
}
