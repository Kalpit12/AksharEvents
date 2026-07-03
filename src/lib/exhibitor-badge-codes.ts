/** Human-readable badge ID printed on A7 exhibitor passes. */
export function formatExhibitorBadgeCode(memberLocalId: string) {
  const compact = memberLocalId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `EXP-${compact || "BADGE"}`;
}
