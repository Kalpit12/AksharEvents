/** Helpers to keep event detail pages free of duplicate rows from repeated seeding. */

export function imagePhotoId(url: string) {
  const match = url.match(/photo-([a-z0-9-]+)/i);
  return match?.[1] ?? url.trim().toLowerCase();
}

export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function uniqueSpeakers<T extends { id: string; name: string }>(speakers: T[]) {
  return dedupeByKey(speakers, (speaker) => speaker.name.trim().toLowerCase());
}

export function uniqueAgendaItems<
  T extends { id: string; title: string; startTime: string; endTime: string },
>(agenda: T[]) {
  return dedupeByKey(
    agenda,
    (item) => `${item.title.trim().toLowerCase()}|${item.startTime}|${item.endTime}`
  );
}

export function uniqueFaqs<T extends { id: string; question: string }>(faqs: T[]) {
  return dedupeByKey(faqs, (faq) => faq.question.trim().toLowerCase());
}

export function uniqueGalleryImages<T extends { id: string; url: string }>(
  gallery: T[],
  banner: string | null | undefined
) {
  const bannerPhoto = banner ? imagePhotoId(banner) : null;
  return dedupeByKey(gallery, (image) => imagePhotoId(image.url)).filter(
    (image) => !bannerPhoto || imagePhotoId(image.url) !== bannerPhoto
  );
}

export function uniqueTicketTypes<T extends { id: string; name: string }>(ticketTypes: T[]) {
  return dedupeByKey(ticketTypes, (ticket) => ticket.name.trim().toLowerCase());
}

export function descriptionWithoutShortLead(description: string, shortDescription: string | null) {
  if (!shortDescription) return description;
  const trimmed = description.trim();
  const lead = shortDescription.trim();
  if (!trimmed.toLowerCase().startsWith(lead.toLowerCase())) return description;
  const rest = trimmed.slice(lead.length).replace(/^[\s.,;:!-]+/, "").trim();
  return rest || description;
}
