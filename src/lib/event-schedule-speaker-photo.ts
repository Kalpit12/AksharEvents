import {
  deletePublicAsset,
  eventScheduleSpeakerFolder,
  uploadPublicAsset,
} from "@/lib/cloudinary-server";
import {
  EVENT_SCHEDULE_SPEAKER_PHOTO_MIME,
  MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES,
} from "@/lib/event-schedule-speaker-photo-constants";
import { nanoid } from "nanoid";

export async function uploadEventScheduleSpeakerPhoto(eventId: string, file: File) {
  if (file.size > MAX_EVENT_SCHEDULE_SPEAKER_PHOTO_BYTES) {
    return { error: "Speaker photo must be 1 MB or smaller" as const };
  }

  if (!EVENT_SCHEDULE_SPEAKER_PHOTO_MIME.has(file.type)) {
    return { error: "Upload a JPG, PNG, or WEBP speaker photo" as const };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await uploadPublicAsset(buffer, {
    folder: eventScheduleSpeakerFolder(eventId),
    publicId: nanoid(12),
    resourceType: "image",
  });

  return {
    url: upload.url,
    publicId: upload.publicId,
  };
}

export async function deleteEventScheduleSpeakerPhoto(publicId: string | null | undefined) {
  if (!publicId) return;
  try {
    await deletePublicAsset(publicId, "image");
  } catch {
    /* non-fatal */
  }
}
