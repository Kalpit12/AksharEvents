import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { dataUrlToBase64 } from "@/lib/visitor-badge-asset";

interface RouteProps {
  params: Promise<{ bookingNumber: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { bookingNumber } = await params;

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber },
    select: { bookingNumber: true, eventId: true, status: true },
  });

  if (!booking || booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const qrDataUrl = await generateQRCodeDataUrl(
    getTicketQRPayload(booking.bookingNumber, booking.eventId)
  );
  const base64 = dataUrlToBase64(qrDataUrl);
  if (!base64) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }

  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
