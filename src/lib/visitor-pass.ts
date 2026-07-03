/** Visitor pass helpers — Option A; signed tokens & per-person passes come in GITEX parity phase. */

export type TicketTypeLike = {
  id?: string;
  name: string;
  price: number;
};

export function isVisitorPassTicket(name: string) {
  return /visitor\s*pass|general\s*pass|visitor\s*registration|register\s*to\s*visit/i.test(name);
}

/** True when the event is primarily free visitor registration (all tickets free). */
export function isFreeVisitorEvent(ticketTypes: TicketTypeLike[]) {
  if (ticketTypes.length === 0) return false;
  return ticketTypes.every((t) => t.price === 0);
}

/** Use GITEX-style "Register to Visit" copy when free-only or a Visitor Pass ticket exists. */
export function isVisitorRegistrationMode(ticketTypes: TicketTypeLike[]) {
  if (ticketTypes.length === 0) return false;
  if (isFreeVisitorEvent(ticketTypes)) return true;
  return ticketTypes.some((t) => isVisitorPassTicket(t.name));
}

export function getPassUrl(bookingNumber: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/pass/${encodeURIComponent(bookingNumber)}`;
}

export function getBadgeDownloadUrl(bookingNumber: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/api/pass/${encodeURIComponent(bookingNumber)}/badge`;
}

export function getQrImageUrl(bookingNumber: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/api/pass/${encodeURIComponent(bookingNumber)}/qr`;
}

/** Prefer General Pass / Visitor Pass, else first free ticket. */
export function pickVisitorTicketType<T extends TicketTypeLike>(ticketTypes: T[]): T | undefined {
  if (ticketTypes.length === 0) return undefined;
  const named = ticketTypes.find(
    (t) => isVisitorPassTicket(t.name) || /general (?:admission|pass)/i.test(t.name)
  );
  if (named) return named;
  const free = ticketTypes.find((t) => t.price === 0);
  return free ?? ticketTypes[0];
}
