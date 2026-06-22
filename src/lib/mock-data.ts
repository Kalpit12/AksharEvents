import type { EventFormat } from "@prisma/client";
import { getHeroImageForEvent } from "@/lib/hero-images";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function price(amount: number) {
  return { toNumber: () => amount };
}

const mockCategories = [
  { id: "cat-tech", name: "Technology", slug: "technology", icon: "💻", color: "#0D9488" },
  { id: "cat-business", name: "Business", slug: "business", icon: "💼", color: "#16A34A" },
  { id: "cat-education", name: "Education", slug: "education", icon: "📚", color: "#3B82F6" },
  { id: "cat-careers", name: "Careers", slug: "careers", icon: "🎯", color: "#F59E0B" },
  { id: "cat-healthcare", name: "Healthcare", slug: "healthcare", icon: "🏥", color: "#EF4444" },
  { id: "cat-agriculture", name: "Agriculture", slug: "agriculture", icon: "🌾", color: "#84CC16" },
  { id: "cat-government", name: "Government", slug: "government", icon: "🏛️", color: "#6366F1" },
  { id: "cat-manufacturing", name: "Manufacturing", slug: "manufacturing", icon: "🏭", color: "#78716C" },
  { id: "cat-entertainment", name: "Entertainment", slug: "entertainment", icon: "🎭", color: "#EC4899" },
];

const mockVenues = [
  {
    id: "venue-baps",
    name: "BAPS Swaminarayan Mandir",
    slug: "baps-swaminarayan-mandir",
    city: "Nairobi",
    country: "Kenya",
    address: "Prof. Wangari Maathai Rd, Nairobi",
    capacity: 1500,
    isPopular: true,
    images: ["/BAPS_Nairobi_Mandir.jpg"],
    description: "Stunning Hindu mandir and cultural venue in Nairobi.",
    facilities: ["Parking", "Assembly Hall"],
    parkingInfo: "On-site parking available.",
    accessibility: "Wheelchair accessible.",
    latitude: -1.26834,
    longitude: 36.822471,
  },
  {
    id: "venue-kicc",
    name: "KICC Convention Centre",
    slug: "kicc-convention-centre",
    city: "Nairobi",
    country: "Kenya",
    address: "Harambee Avenue, City Square, Nairobi",
    capacity: 5000,
    isPopular: true,
    images: ["/KICC.jpg"],
    description: "Kenya's premier convention and exhibition centre.",
    facilities: ["Parking", "WiFi", "Catering"],
    parkingInfo: "On-site parking available for 500+ vehicles.",
    accessibility: "Wheelchair accessible throughout.",
    latitude: -1.28861,
    longitude: 36.82306,
  },
  {
    id: "venue-sarit",
    name: "Sarit Expo Centre",
    slug: "sarit-expo-centre",
    city: "Nairobi",
    country: "Kenya",
    address: "Karuna Road, Westlands, Nairobi",
    capacity: 3000,
    isPopular: true,
    images: ["/SARIT.jpg"],
    description: "Modern expo centre in Westlands.",
    facilities: ["Parking", "WiFi"],
    parkingInfo: "Basement parking available.",
    accessibility: "Elevator access to all floors.",
    latitude: -1.2602256,
    longitude: 36.8006199,
  },
];

const mockOrganizer = {
  id: "org-1",
  name: "Kenya Events Co.",
  image: null,
  bio: "Leading event organizer across East Africa.",
  company: "Kenya Events Co.",
  isVerified: true,
  _count: { organizedEvents: 8 },
};

type MockEventSeed = {
  id: string;
  title: string;
  slug: string;
  format: EventFormat;
  categorySlug: string;
  venueSlug: string;
  isFeatured: boolean;
  isTrending: boolean;
  description: string;
  shortDescription: string;
  daysFromNow: number;
  duration: number;
  price: number;
  tags: string[];
};

const eventSeeds: MockEventSeed[] = [
  {
    id: "evt-1",
    title: "Kenya Career Expo 2026",
    slug: "kenya-career-expo-2026",
    format: "JOB_FAIR",
    categorySlug: "careers",
    venueSlug: "kicc-convention-centre",
    isFeatured: true,
    isTrending: true,
    description:
      "East Africa's largest career fair connecting top employers with talented professionals.",
    shortDescription: "East Africa's largest career fair with 200+ employers",
    daysFromNow: 30,
    duration: 3,
    price: 0,
    tags: ["careers", "jobs"],
  },
  {
    id: "evt-2",
    title: "Nairobi Tech Summit 2026",
    slug: "nairobi-tech-summit-2026",
    format: "TECHNOLOGY",
    categorySlug: "technology",
    venueSlug: "sarit-expo-centre",
    isFeatured: true,
    isTrending: true,
    description: "Africa's premier technology conference for innovators and developers.",
    shortDescription: "Africa's premier tech conference",
    daysFromNow: 45,
    duration: 2,
    price: 2500,
    tags: ["technology", "AI"],
  },
  {
    id: "evt-3",
    title: "University of Nairobi Open Day",
    slug: "university-of-nairobi-open-day",
    format: "UNIVERSITY_EVENT",
    categorySlug: "education",
    venueSlug: "sarit-expo-centre",
    isFeatured: false,
    isTrending: true,
    description: "Explore academic programs, meet faculty, and tour campus facilities.",
    shortDescription: "Explore programs and campus life at UoN",
    daysFromNow: 15,
    duration: 1,
    price: 0,
    tags: ["education", "university"],
  },
  {
    id: "evt-4",
    title: "East Africa Healthcare Conference",
    slug: "east-africa-healthcare-conference",
    format: "HEALTHCARE",
    categorySlug: "healthcare",
    venueSlug: "kicc-convention-centre",
    isFeatured: true,
    isTrending: false,
    description: "Annual healthcare conference on medical innovation and public health.",
    shortDescription: "Healthcare innovation across East Africa",
    daysFromNow: 60,
    duration: 2,
    price: 5000,
    tags: ["healthcare"],
  },
  {
    id: "evt-5",
    title: "AgriTech Expo Kenya",
    slug: "agritech-expo-kenya",
    format: "EXPO",
    categorySlug: "agriculture",
    venueSlug: "kicc-convention-centre",
    isFeatured: false,
    isTrending: true,
    description: "Showcasing agricultural technology and sustainable farming practices.",
    shortDescription: "Agricultural technology and innovation expo",
    daysFromNow: 90,
    duration: 3,
    price: 1500,
    tags: ["agriculture"],
  },
  {
    id: "evt-6",
    title: "Corporate Networking Gala",
    slug: "corporate-networking-gala",
    format: "NETWORKING",
    categorySlug: "business",
    venueSlug: "sarit-expo-centre",
    isFeatured: false,
    isTrending: false,
    description: "An exclusive evening of networking for business leaders and investors.",
    shortDescription: "Exclusive business networking evening",
    daysFromNow: 20,
    duration: 1,
    price: 3000,
    tags: ["business"],
  },
  {
    id: "evt-7",
    title: "Digital Skills Workshop Series",
    slug: "digital-skills-workshop-series",
    format: "WORKSHOP",
    categorySlug: "technology",
    venueSlug: "sarit-expo-centre",
    isFeatured: false,
    isTrending: false,
    description: "Hands-on workshops covering web development, data science, and more.",
    shortDescription: "Hands-on digital skills training",
    daysFromNow: 10,
    duration: 1,
    price: 500,
    tags: ["technology", "training"],
  },
  {
    id: "evt-8",
    title: "Kenya Manufacturing Summit",
    slug: "kenya-manufacturing-summit",
    format: "CONFERENCE",
    categorySlug: "manufacturing",
    venueSlug: "kicc-convention-centre",
    isFeatured: true,
    isTrending: false,
    description: "Industry leaders discuss manufacturing innovation and supply chains.",
    shortDescription: "Manufacturing industry conference",
    daysFromNow: 75,
    duration: 2,
    price: 4000,
    tags: ["manufacturing"],
  },
];

function buildMockEvent(seed: MockEventSeed, index: number) {
  const category = mockCategories.find((c) => c.slug === seed.categorySlug)!;
  const venue = mockVenues.find((v) => v.slug === seed.venueSlug)!;
  const startDate = daysFromNow(seed.daysFromNow);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + seed.duration - 1);

  return {
    id: seed.id,
    title: seed.title,
    slug: seed.slug,
    banner: getHeroImageForEvent(seed.categorySlug, index),
    startDate,
    endDate,
    format: seed.format,
    status: "PUBLISHED" as const,
    isFeatured: seed.isFeatured,
    isTrending: seed.isTrending,
    description: seed.description,
    shortDescription: seed.shortDescription,
    categoryId: category.id,
    tags: seed.tags,
    viewCount: 120,
    capacity: venue.capacity,
    category,
    venue: { name: venue.name, city: venue.city, address: venue.address, country: venue.country },
    organizer: mockOrganizer,
    ticketTypes: [
      {
        id: `${seed.id}-ticket`,
        name: seed.price === 0 ? "Free Entry" : "General Admission",
        description: null,
        tier: seed.price === 0 ? ("FREE" as const) : ("PAID" as const),
        price: price(seed.price),
        quantity: 500,
        sold: 45,
        maxPerOrder: 10,
        minPerOrder: 1,
        isActive: true,
      },
    ],
    speakers: [],
    agenda: [],
    gallery: [],
    faqs: [],
    sponsors: [],
    exhibitors: [],
    reviews: [],
    _count: { reviews: 0, favorites: 12, bookings: 45 },
  };
}

export const mockEvents = eventSeeds.map((seed, index) => buildMockEvent(seed, index));

export function getMockCategories() {
  return mockCategories;
}

export function getMockPopularVenues(limit = 4) {
  return mockVenues.filter((v) => v.isPopular).slice(0, limit);
}

export function getMockVenues() {
  return mockVenues.map((venue) => ({
    ...venue,
    _count: {
      events: mockEvents.filter((e) => e.venue?.name === venue.name).length,
    },
  }));
}

export function getMockVenueBySlug(slug: string) {
  const venue = mockVenues.find((v) => v.slug === slug);
  if (!venue) return null;

  return {
    ...venue,
    events: mockEvents.filter((e) => e.venue?.name === venue.name).slice(0, 6),
  };
}

export function getMockTestimonials() {
  return [
    {
      id: "t1",
      name: "James Ochieng",
      role: "HR Director",
      company: "Safaricom",
      content: "AksharEvents made our career fair seamless. Over 2,000 attendees registered online.",
      rating: 5,
      isActive: true,
    },
    {
      id: "t2",
      name: "Sarah Mwangi",
      role: "Event Manager",
      company: "Nairobi Tech Hub",
      content: "The best platform for discovering and booking tech events in Kenya.",
      rating: 5,
      isActive: true,
    },
    {
      id: "t3",
      name: "David Kimani",
      role: "Student",
      company: "University of Nairobi",
      content: "Found amazing university events and got my tickets instantly with QR codes.",
      rating: 4,
      isActive: true,
    },
  ];
}

export function getMockSponsors() {
  return [
    { id: "s1", name: "Safaricom" },
    { id: "s2", name: "KCB Bank" },
    { id: "s3", name: "Equity Bank" },
    { id: "s4", name: "Co-operative Bank" },
    { id: "s5", name: "NCBA Bank" },
    { id: "s6", name: "Kenya Airways" },
    { id: "s7", name: "Nation Media Group" },
    { id: "s8", name: "East African Breweries" },
    { id: "s9", name: "KenGen" },
    { id: "s10", name: "Jubilee Insurance" },
    { id: "s11", name: "University of Nairobi" },
    { id: "s12", name: "Britam" },
  ];
}

export function getMockPublishedEvents(options: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  format?: EventFormat;
  city?: string;
  search?: string;
  featured?: boolean;
  trending?: boolean;
  sort?: "upcoming" | "newest" | "popular";
} = {}) {
  let events = [...mockEvents];

  if (options.categorySlug) {
    events = events.filter((e) => e.category.slug === options.categorySlug);
  }
  if (options.format) {
    events = events.filter((e) => e.format === options.format);
  }
  if (options.city) {
    events = events.filter((e) =>
      e.venue?.city.toLowerCase().includes(options.city!.toLowerCase())
    );
  }
  if (options.featured) {
    events = events.filter((e) => e.isFeatured);
  }
  if (options.trending) {
    events = events.filter((e) => e.isTrending);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q))
    );
  }

  if (options.sort === "popular") {
    events.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  const total = events.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 12;
  const page = events.slice(offset, offset + limit);

  return { events: page, total, pages: Math.ceil(total / limit) };
}

export function getMockEventBySlug(slug: string) {
  return mockEvents.find((e) => e.slug === slug) ?? null;
}

export function getMockSimilarEvents(eventId: string, categoryId: string, limit = 4) {
  return mockEvents
    .filter((e) => e.id !== eventId && e.categoryId === categoryId)
    .slice(0, limit);
}

export function getMockRecommendedEvents(limit = 6) {
  return mockEvents.slice(0, limit);
}
