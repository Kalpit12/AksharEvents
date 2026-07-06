/** Shared on-site registration & check-in URL for an event. */
export function getBoothKioskUrl(eventSlug: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const path = `/booth/${eventSlug}`;
  return base ? `${base}${path}` : path;
}
