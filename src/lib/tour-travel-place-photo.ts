import {
  deletePublicAsset,
  eventTourTravelPlaceFolder,
  uploadPublicAsset,
} from "@/lib/cloudinary-server";
import {
  EVENT_SCHEDULE_SPEAKER_PHOTO_ACCEPT,
  EVENT_SCHEDULE_SPEAKER_PHOTO_MIME,
  MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES,
} from "@/lib/event-schedule-speaker-photo-constants";
import { nanoid } from "nanoid";

export const MAX_TOUR_PLACE_PHOTO_BYTES = MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES;
export const TOUR_PLACE_PHOTO_MIME = EVENT_SCHEDULE_SPEAKER_PHOTO_MIME;
export const TOUR_PLACE_PHOTO_ACCEPT = EVENT_SCHEDULE_SPEAKER_PHOTO_ACCEPT;

export async function uploadTourTravelPlacePhoto(eventId: string, file: File) {
  if (file.size > MAX_TOUR_PLACE_PHOTO_BYTES) {
    return { error: "Place photo must be 1 MB or smaller" as const };
  }

  if (!TOUR_PLACE_PHOTO_MIME.has(file.type)) {
    return { error: "Upload a JPG, PNG, or WEBP place photo" as const };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await uploadPublicAsset(buffer, {
    folder: eventTourTravelPlaceFolder(eventId),
    publicId: nanoid(12),
    resourceType: "image",
  });

  return {
    url: upload.url,
    publicId: upload.publicId,
  };
}

export async function deleteTourTravelPlacePhoto(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await deletePublicAsset(publicId, "image");
  } catch {
    /* non-fatal */
  }
}
