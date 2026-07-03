import { writeFileSync } from "fs";
import { createRequire } from "module";
import sharp from "sharp";

async function main() {
  const require = createRequire(import.meta.url);
  require.cache[require.resolve("server-only")] = {
    id: "server-only",
    filename: "server-only",
    loaded: true,
    exports: {},
  } as NodeModule;

  const { buildExhibitorBadgePdf, buildExhibitorBadgeSvg } = await import(
    "../src/lib/exhibitor-badge-asset"
  );

  const photo = await sharp({
    create: { width: 400, height: 400, channels: 3, background: { r: 210, g: 195, b: 175 } },
  })
    .jpeg()
    .toBuffer();

  const sample = {
    memberName: "Kapz Patel",
    memberRole: "Director",
    companyName: "Maxpro Infotech Ltd",
    boothLabel: "A-12",
    eventTitle: "Kenya Career Expo 2026",
    startDate: new Date("2026-07-20"),
    endDate: new Date("2026-07-22"),
    memberLocalId: "mem-kapz-001",
    qrDataUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=196x196&data=axar-exhibitor-test",
    photoBuffer: photo,
  };

  const svg = await buildExhibitorBadgeSvg(sample);
  writeFileSync("tmp-exhibitor-badge.svg", svg, "utf8");
  const pdf = await buildExhibitorBadgePdf(sample);
  writeFileSync("tmp-exhibitor-badge.pdf", Buffer.from(pdf));
  console.log("Wrote tmp-exhibitor-badge.svg and tmp-exhibitor-badge.pdf");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
