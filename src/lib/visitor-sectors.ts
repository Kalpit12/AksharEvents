/** Industry sectors for visitor registration (GITEX-style profiling). */

export const VISITOR_SECTORS = [
  "Technology & IT",
  "Finance & Banking",
  "Healthcare & Life Sciences",
  "Education & Research",
  "Government & Public Sector",
  "Manufacturing & Industrial",
  "Retail & E-commerce",
  "Telecommunications",
  "Energy & Utilities",
  "Agriculture & AgriTech",
  "Media & Entertainment",
  "Real Estate & Construction",
  "Hospitality & Tourism",
  "Legal & Professional Services",
  "NGO & Non-profit",
  "Startup / Entrepreneur",
  "Student",
  "Other",
] as const;

export type VisitorSector = (typeof VISITOR_SECTORS)[number];
