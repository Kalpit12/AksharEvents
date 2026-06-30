import { v2 as cloudinary } from "cloudinary";

const EXHIBITOR_DOC_FOLDER = "akshar-events/exhibitor-documents";
const BRANDING_ARTWORK_FOLDER = "akshar-events/branding-artwork";

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, "");
}

export function getCloudinaryConfig() {
  const cloudName = readEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = readEnv("CLOUDINARY_API_KEY");
  const apiSecret = readEnv("CLOUDINARY_API_SECRET");
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured for this deployment (missing: ${missing.join(", ")}). ` +
        "In Vercel → Settings → Environment Variables, enable Production (not Preview only) for all CLOUDINARY_* vars, then redeploy."
    );
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };
}

function ensureCloudinaryConfig() {
  return getCloudinaryConfig();
}

export function exhibitorDocumentFolder(eventExhibitorId: string, memberLocalId: string) {
  return `${EXHIBITOR_DOC_FOLDER}/${eventExhibitorId}/${memberLocalId}`;
}

export function brandingArtworkFolder(eventExhibitorId: string, itemMasterId: string) {
  return `${BRANDING_ARTWORK_FOLDER}/${eventExhibitorId}/${itemMasterId}`;
}

export function createBrandingArtworkUploadSignature(params: {
  eventExhibitorId: string;
  itemMasterId: string;
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const folder = brandingArtworkFolder(params.eventExhibitorId, params.itemMasterId);
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, type: "authenticated" },
    apiSecret
  );
  return { cloudName, apiKey, signature, timestamp, folder };
}

export function createAuthenticatedUploadSignature(params: {
  eventExhibitorId: string;
  memberLocalId: string;
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const folder = exhibitorDocumentFolder(params.eventExhibitorId, params.memberLocalId);
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, type: "authenticated" },
    apiSecret
  );
  return { cloudName, apiKey, signature, timestamp, folder };
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

function sanitizeAttachmentFileName(fileName: string) {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "artwork";
  const sanitized = base.replace(/[^\w.\- ()[\]]+/g, "_");
  return sanitized || "artwork";
}

/** Original authenticated asset — no transforms; optional attachment for download. */
export function getAuthenticatedBrandingArtworkUrl(
  publicId: string,
  options: {
    resourceType: "image" | "raw" | "video";
    download?: boolean;
    fileName?: string;
    expiresInSeconds?: number;
  }
) {
  ensureCloudinaryConfig();
  const flags = options.download
    ? options.fileName
      ? `attachment:${sanitizeAttachmentFileName(options.fileName)}`
      : "attachment"
    : undefined;

  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: options.resourceType,
    flags,
    expires_at: Math.floor(Date.now() / 1000) + (options.expiresInSeconds ?? 600),
  });
}

export async function resolveBrandingArtworkResourceType(
  publicId: string,
  stored: string | null | undefined,
  mimeType: string | null | undefined
): Promise<"image" | "raw"> {
  if (stored === "image" || stored === "raw") return stored;

  ensureCloudinaryConfig();
  const preferred =
    mimeType === "application/pdf" ||
    mimeType === "application/postscript" ||
    mimeType === "application/illustrator"
      ? "raw"
      : "image";

  for (const resourceType of [preferred, preferred === "image" ? "raw" : "image"] as const) {
    try {
      await cloudinary.api.resource(publicId, {
        type: "authenticated",
        resource_type: resourceType,
      });
      return resourceType;
    } catch {
      /* try alternate */
    }
  }

  return preferred;
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
