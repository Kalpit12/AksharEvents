/** Curated hero backgrounds — verified Unsplash URLs for the homepage carousel */
export const HERO_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=80",
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1600&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=80",
] as const;

const HERO_IMAGE_BY_CATEGORY: Record<string, (typeof HERO_EVENT_IMAGES)[number]> = {
  careers: HERO_EVENT_IMAGES[0],
  technology: HERO_EVENT_IMAGES[1],
  education: HERO_EVENT_IMAGES[2],
  business: HERO_EVENT_IMAGES[3],
  healthcare: HERO_EVENT_IMAGES[4],
  agriculture: HERO_EVENT_IMAGES[5],
  government: HERO_EVENT_IMAGES[3],
  manufacturing: HERO_EVENT_IMAGES[4],
  entertainment: HERO_EVENT_IMAGES[5],
};

export function getHeroImageForEvent(categorySlug: string, index: number): string {
  return HERO_IMAGE_BY_CATEGORY[categorySlug] ?? HERO_EVENT_IMAGES[index % HERO_EVENT_IMAGES.length];
}

export const DEFAULT_HERO_SLIDES = [
  {
    title: "Discover. Book. Experience.",
    subtitle: "Career fairs, conferences, and expos across Kenya and Africa",
    image: HERO_EVENT_IMAGES[0],
    href: "/events",
    cta: "Browse Events",
  },
  {
    title: "Expos & Conferences",
    subtitle: "Trade shows, summits, and networking near you",
    image: HERO_EVENT_IMAGES[2],
    href: "/events",
    cta: "View All Events",
  },
  {
    title: "Live Experiences",
    subtitle: "From workshops to festivals — find your next event",
    image: HERO_EVENT_IMAGES[5],
    href: "/events",
    cta: "Find Events",
  },
] as const;
