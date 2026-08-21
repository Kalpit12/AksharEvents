export const MAX_PARTNER_LOGO_BYTES = 2 * 1024 * 1024;

export const PARTNER_LOGO_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const PARTNER_LOGO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

const PARTNER_LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];

export function isAllowedPartnerLogo(file: { name: string; type: string }) {
  if (PARTNER_LOGO_MIME.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return PARTNER_LOGO_EXTENSIONS.some((ext) => name.endsWith(ext));
}
