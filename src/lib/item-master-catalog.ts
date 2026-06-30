import type { EventItemMasterOption } from "@/lib/event-config-types";

export const ITEM_MASTER_CATEGORY_BOOTH = "Booth";
/** @deprecated Legacy category name — still recognised when reading existing rows */
export const LEGACY_BOOTH_CATEGORY = "Booth preference";

export const DEFAULT_VAT_RATE = 0.16;

/** Default booth packages for item master seeding */
export const DEFAULT_BOOTH_ITEMS: { name: string; unitCost: number }[] = [
  {
    name: "Booth 3x3 MTR Table 1, 2 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name)",
    unitCost: 150_000,
  },
  {
    name: "Booth 4x3 MTR Table 2, 4 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name) Silver",
    unitCost: 220_000,
  },
  {
    name: "Booth 6x3 MTR Table 2, 6 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name) Gold",
    unitCost: 350_000,
  },
  {
    name: "Booth 5x6 MTR Table 3, 8 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name) Platinum",
    unitCost: 500_000,
  },
  {
    name: "Booth 3x2 MTR Table 1, 2 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name)",
    unitCost: 120_000,
  },
  {
    name: "Booth 2x2 MTR Table 1, 2 Chairs(Covered), 2 Lights, 1 Socket(4 Plug), 1 Dustbin, 1 Facia Board Inclusive Name)",
    unitCost: 80_000,
  },
  {
    name: "Booth Deco All Sizes",
    unitCost: 75_000,
  },
];

export const ITEM_MASTER_CATEGORY_EQUIPMENT = "Equipment";

/** Televisions & displays — Equipment category */
export const DEFAULT_EQUIPMENT_ITEMS: { name: string; unitCost: number }[] = [
  { name: 'TV 50" + TV Stand + HDMI', unitCost: 45_000 },
  { name: 'TV 60" + TV Stand + HDMI', unitCost: 65_000 },
  { name: "Touch Screen", unitCost: 85_000 },
];

export const ITEM_MASTER_CATEGORY_TABLES_CHAIRS = "Tables, Chairs & Cabinets";

export const DEFAULT_TABLES_CHAIRS_ITEMS: { name: string; unitCost: number }[] = [
  { name: "Dressing of Table", unitCost: 3_500 },
  { name: "Table", unitCost: 2_500 },
  { name: "Bar Stool", unitCost: 1_800 },
  { name: "Lockable Cabinet", unitCost: 8_500 },
  { name: "Chair (Covered)", unitCost: 1_200 },
  { name: "Display Glass Cabinet", unitCost: 12_000 },
  { name: "cocktail table", unitCost: 4_500 },
  { name: "Sofa Single Sitter", unitCost: 15_000 },
  { name: "Sofa Two Sitter", unitCost: 22_000 },
  { name: "Coffee Table", unitCost: 5_500 },
  { name: "Bronchure Rack 6 slots", unitCost: 6_500 },
  { name: "Carpet 1 SQM (Light Carpet)", unitCost: 850 },
  { name: "Carpet Per booth", unitCost: 4_500 },
];

export const ITEM_MASTER_CATEGORY_FLOWERS = "Flowers & Plant";

export const DEFAULT_FLOWERS_ITEMS: { name: string; unitCost: number }[] = [
  { name: "Flower Bouque", unitCost: 3_500 },
  { name: "Potted Plant", unitCost: 5_000 },
];

export const ITEM_MASTER_CATEGORY_BRANDINGS = "Brandings";

export const DEFAULT_BRANDINGS_ITEMS: { name: string; unitCost: number }[] = [
  { name: "Printing one 1M by 2.5 stickers, & Pasting/Removal", unitCost: 18_000 },
  { name: "Badges & Stripes", unitCost: 2_500 },
  { name: "Rollup Banner", unitCost: 12_000 },
  { name: "Media Banner", unitCost: 25_000 },
  { name: "Registration Desk 6 Tables + 9 Chairs branding", unitCost: 45_000 },
  { name: "teardrop", unitCost: 18_000 },
  { name: "Entrance Ark", unitCost: 85_000 },
  { name: "T-Shirts", unitCost: 1_800 },
  { name: "Give away bag,kikoy,water bottle", unitCost: 2_500 },
  { name: "Stand Assistant", unitCost: 8_000 },
  { name: "Usherers", unitCost: 6_500 },
];

export type CatalogSeedGroup = {
  category: string;
  items: { name: string; unitCost: number }[];
};

export const DEFAULT_ADDITIONAL_CATALOG_GROUPS: CatalogSeedGroup[] = [
  { category: ITEM_MASTER_CATEGORY_EQUIPMENT, items: DEFAULT_EQUIPMENT_ITEMS },
  { category: ITEM_MASTER_CATEGORY_TABLES_CHAIRS, items: DEFAULT_TABLES_CHAIRS_ITEMS },
  { category: ITEM_MASTER_CATEGORY_FLOWERS, items: DEFAULT_FLOWERS_ITEMS },
  { category: ITEM_MASTER_CATEGORY_BRANDINGS, items: DEFAULT_BRANDINGS_ITEMS },
];

const CATEGORY_GUIDANCE: Record<string, string> = {
  Equipment:
    "AV, displays, furniture, and technical equipment for your booth and team.",
  [ITEM_MASTER_CATEGORY_TABLES_CHAIRS]:
    "Tables, seating, sofas, racks, and carpets for your booth layout.",
  [ITEM_MASTER_CATEGORY_FLOWERS]: "Floral arrangements and plants for booth decoration.",
  [ITEM_MASTER_CATEGORY_BRANDINGS]:
    "Banners, signage, branded materials, and on-site brand support staff.",
  Consumables: "Day-to-day supplies such as water, stationery, and catering consumables.",
  Stationery: "Printed materials, badges, and office supplies.",
  Catering: "Extra meals, refreshments, or catering services beyond the standard plan.",
  Merchandise: "Branded items, giveaways, and promotional products.",
  Services: "Labour, setup, cleaning, or other contracted services.",
  Other: "Any other add-ons not listed above.",
};

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

export function isBoothCategory(category: string) {
  const normalized = normalizeCategory(category);
  return (
    normalized === normalizeCategory(ITEM_MASTER_CATEGORY_BOOTH) ||
    normalized === normalizeCategory(LEGACY_BOOTH_CATEGORY)
  );
}

export function getBoothCatalogItems(items: EventItemMasterOption[]) {
  return items.filter((item) => isBoothCategory(item.category));
}

export function getBrandingCatalogItems(items: EventItemMasterOption[]) {
  return items.filter((item) => isBrandingCategory(item.category));
}

export function isBrandingCategory(category: string) {
  return normalizeCategory(category) === normalizeCategory(ITEM_MASTER_CATEGORY_BRANDINGS);
}

export function getAdditionalRequirementItems(items: EventItemMasterOption[]) {
  return items.filter((item) => !isBoothCategory(item.category));
}

export function groupItemsByCategory(items: EventItemMasterOption[]) {
  const map = new Map<string, EventItemMasterOption[]>();
  for (const item of items) {
    const bucket = map.get(item.category) ?? [];
    bucket.push(item);
    map.set(item.category, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, categoryItems]) => ({
      category,
      items: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
      guidance: CATEGORY_GUIDANCE[category] ?? `Select items from ${category}.`,
    }));
}

export function categorySelectPrompt(category: string) {
  if (isBoothCategory(category)) return "Choose your booth package.";
  return CATEGORY_GUIDANCE[category] ?? `Select any ${category} items you need.`;
}
