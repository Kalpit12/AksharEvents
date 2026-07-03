import { writeFileSync } from "fs";
import { join } from "path";
import { buildVisitorBadgePdf, buildVisitorBadgeSvg } from "../src/lib/visitor-badge-asset";
import { generateQRCodeDataUrl, getTicketQRPayload } from "../src/lib/qr";

async function main() {
  const bookingNumber = "AE-MR4OO9QQ-V4T7";
  const qrDataUrl = await generateQRCodeDataUrl(
    getTicketQRPayload(bookingNumber, "preview-event-id")
  );

  const sample = {
    attendeeName: "Kalpit Patel",
    attendeeDesignation: "CTO",
    eventTitle: "Kenya Career Expo 2026",
    startDate: new Date("2026-07-20"),
    endDate: new Date("2026-07-22"),
    venueName: "KICC Convention Centre",
    venueCity: "Nairobi",
    bookingNumber,
    passLabel: "VISITOR",
    qrDataUrl,
  };

  const svg = buildVisitorBadgeSvg(sample);
  writeFileSync(join(process.cwd(), "tmp-badge-preview.svg"), svg, "utf8");

  const pdf = await buildVisitorBadgePdf(sample);
  writeFileSync(join(process.cwd(), "tmp-badge-preview.pdf"), Buffer.from(pdf));

  console.log("Wrote tmp-badge-preview.svg and tmp-badge-preview.pdf");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
