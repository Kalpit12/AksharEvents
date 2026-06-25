import { v2 as cloudinary } from "cloudinary";

const EXHIBITOR_DOC_FOLDER = "akshar-events/exhibitor-documents";

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret };
}

export function exhibitorDocumentFolder(eventExhibitorId: string, memberLocalId: string) {
  return `${EXHIBITOR_DOC_FOLDER}/${eventExhibitorId}/${memberLocalId}`;
}

export async function uploadAuthenticatedDocument(
  buffer: Buffer,
  options: {
    eventExhibitorId: string;
    memberLocalId: string;
    originalFileName: string;
    mimeType: string;
  }
) {
  ensureCloudinaryConfig();
  const folder = exhibitorDocumentFolder(options.eventExhibitorId, options.memberLocalId);

  return new Promise<{ publicId: string; bytes: number; resourceType: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        type: "authenticated",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );
    upload.end(buffer);
  });
}

/** Short-lived signed URL for server-side fetch only (PDF build, admin review). */
export function getAuthenticatedDocumentUrl(publicId: string, resourceType: "image" | "raw" | "video" = "image") {
  ensureCloudinaryConfig();
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: resourceType,
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });
}

export async function fetchAuthenticatedDocumentBuffer(publicId: string, resourceType: "image" | "raw" | "video" = "image") {
  const url = getAuthenticatedDocumentUrl(publicId, resourceType);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteAuthenticatedDocument(publicId: string) {
  ensureCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId, { type: "authenticated", resource_type: "auto" });
}
