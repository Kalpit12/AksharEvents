import QRCode from "qrcode";

/** Standard black QR modules for reliable scanning on badges and passes. */
export const BADGE_QR_COLOR = "#000000";

export async function generateQRCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: BADGE_QR_COLOR, light: "#FFFFFF" },
  });
}

export function getTicketQRPayload(bookingNumber: string, eventId: string) {
  return JSON.stringify({
    type: "akshar-ticket",
    booking: bookingNumber,
    event: eventId,
    v: 1,
  });
}
