import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "KES") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string, pattern = "PPP") {
  return format(new Date(date), pattern);
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateBookingNumber() {
  const prefix = "AE";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getEventStatus(startDate: Date, endDate: Date) {
  const now = new Date();
  if (isPast(new Date(endDate))) return "completed";
  if (isFuture(new Date(startDate))) return "upcoming";
  return "live";
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export const BRAND = {
  name: "AxarEvents",
  tagline: "Discover. Book. Experience.",
  colors: {
    primary: "#0D9488",
    secondary: "#16A34A",
    accent: "#F59E0B",
    background: "#FFFFFF",
    text: "#111827",
  },
} as const;

export const EVENT_FORMATS = [
  { value: "EXPO", label: "Expos", description: "Trade shows and exhibitions" },
  { value: "CONFERENCE", label: "Conferences", description: "Industry conferences" },
  { value: "JOB_FAIR", label: "Job Fairs", description: "Recruitment and career fairs" },
  { value: "CAREER_EVENT", label: "Career Events", description: "Professional development" },
  { value: "UNIVERSITY_EVENT", label: "University Events", description: "Campus and academic events" },
  { value: "TECHNOLOGY", label: "Technology", description: "Tech summits and hackathons" },
  { value: "HEALTHCARE", label: "Healthcare", description: "Medical and health events" },
  { value: "WORKSHOP", label: "Workshops", description: "Training and skill development" },
  { value: "NETWORKING", label: "Networking", description: "Corporate networking events" },
  { value: "COMMUNITY", label: "Community", description: "Local community gatherings" },
] as const;

export const CATEGORIES = [
  { name: "Technology", slug: "technology" },
  { name: "Business", slug: "business" },
  { name: "Education", slug: "education" },
  { name: "Careers", slug: "careers" },
  { name: "Healthcare", slug: "healthcare" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Government", slug: "government" },
  { name: "Manufacturing", slug: "manufacturing" },
  { name: "Entertainment", slug: "entertainment" },
] as const;
