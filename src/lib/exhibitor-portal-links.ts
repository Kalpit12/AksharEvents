import type { LucideIcon } from "lucide-react";

export type ExhibitorPortalLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

/** Top-bar portal shortcuts (intentionally empty — use in-dashboard menu instead). */
export const exhibitorPortalLinks: readonly ExhibitorPortalLink[] = [];
