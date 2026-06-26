/** Default travel agent inbox when FLIGHT_BOOKING_AGENT_EMAIL is not set. */
export const DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL = "samantha.mutinda@maxproinfotech.com";

export function getFlightBookingAgentEmail(): string {
  const fromEnv = process.env.FLIGHT_BOOKING_AGENT_EMAIL?.trim();
  return fromEnv || DEFAULT_FLIGHT_BOOKING_AGENT_EMAIL;
}
