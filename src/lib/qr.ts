import QRCode from "qrcode";

export async function generateQRCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: "#0D9488", light: "#FFFFFF" },
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
