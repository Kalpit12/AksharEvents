export type VenueShareData = {
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001";
}

export function buildVenueShareText(venue: VenueShareData, baseUrl = getAppBaseUrl()) {
  const pageUrl = `${baseUrl}/venues/${venue.slug}`;
  const mapsUrl =
    venue.latitude != null && venue.longitude != null
      ? `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
      : null;

  return [
    `*${venue.name}*`,
    `📍 ${venue.address}, ${venue.city}, ${venue.country}`,
    `👥 Capacity: ${venue.capacity.toLocaleString()}`,
    venue.description,
    mapsUrl ? `🗺 ${mapsUrl}` : null,
    `🔗 ${pageUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildVenueWhatsAppUrl(venue: VenueShareData, baseUrl = getAppBaseUrl()) {
  return `https://wa.me/?text=${encodeURIComponent(buildVenueShareText(venue, baseUrl))}`;
}
