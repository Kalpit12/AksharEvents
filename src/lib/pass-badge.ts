/** Derive badge ribbon label from ticket type name / tier. */

export function getPassBadgeLabel(ticketTypeName?: string | null, tier?: string | null) {
  const name = (ticketTypeName ?? "").toLowerCase();
  if (/vip/i.test(name) || tier === "VIP") return "VIP";
  if (/visitor|general (?:admission|pass)|free/i.test(name) || tier === "FREE") return "VISITOR";
  if (ticketTypeName) {
    const first = ticketTypeName.split(/[\s(]/)[0];
    return first.toUpperCase().slice(0, 12);
  }
  return "VISITOR";
}
