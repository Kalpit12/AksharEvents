import { nanoid } from "nanoid";
import { partnerLogoFolder, uploadPublicAsset } from "@/lib/cloudinary-server";
import { isHexColor, type LogoPalette } from "@/lib/logo-palette";
import {
  MAX_PARTNER_LOGO_BYTES,
  isAllowedPartnerLogo,
} from "@/lib/partner-logo-constants";

export async function uploadPartnerLogo(slug: string, file: File) {
  if (file.size > MAX_PARTNER_LOGO_BYTES) {
    return { error: "Logo must be 2 MB or smaller" as const };
  }
  if (!isAllowedPartnerLogo(file)) {
    return { error: "Upload a PNG, JPG, WEBP, GIF, or SVG logo" as const };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await uploadPublicAsset(buffer, {
    folder: partnerLogoFolder(slug),
    publicId: `logo-${nanoid(8)}`,
    resourceType: "image",
  });

  return {
    url: upload.url,
    publicId: upload.publicId,
  };
}

export function paletteFromForm(formData: FormData, fallback?: LogoPalette | null): LogoPalette {
  const pick = (key: string, backup: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return isHexColor(value) ? value.toLowerCase() : backup;
  };
  return {
    primary: pick("primaryColor", fallback?.primary ?? "#0d9488"),
    secondary: pick("secondaryColor", fallback?.secondary ?? "#0f766e"),
    accent: pick("accentColor", fallback?.accent ?? "#14b8a6"),
    background: pick("backgroundColor", fallback?.background ?? "#ffffff"),
    foreground: pick("foregroundColor", fallback?.foreground ?? "#000000"),
  };
}
