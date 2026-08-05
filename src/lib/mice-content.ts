/** Shared copy for MICE (Meetings, Incentives, Conferences, Exhibitions) positioning. */

export const MICE_LETTERS = [
  { letter: "M", term: "Meetings", detail: "Board meetings, AGMs, dealer sessions, and internal gatherings" },
  { letter: "I", term: "Incentives", detail: "Reward trips and recognition programs for teams, partners, or customers" },
  { letter: "C", term: "Conferences", detail: "Sales conferences, industry summits, and professional seminars" },
  { letter: "E", term: "Exhibitions", detail: "Trade shows, business expos, and product launches" },
] as const;

export const MICE_EXAMPLES = [
  "Business expos and trade shows",
  "Corporate seminars and training workshops",
  "B2B networking events",
  "Company AGMs and annual meetings",
  "Product launches and dealer meetings",
  "Industry conferences",
] as const;

export const MICE_TAGLINE =
  "MICE covers professional business events — not social occasions such as weddings or birthday parties.";

export const MICE_VENUE_IDEAL_FOR =
  "This space is suited for MICE-style business gatherings: meetings, conferences, expos, seminars, AGMs, and corporate training.";
