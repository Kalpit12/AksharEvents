import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BAPS_IMAGES = [
  "/Baps-Community-hall-1.png",
  "/Baps-Community-hall-2.jpeg",
];

async function main() {
  const venue = await prisma.venue.update({
    where: { slug: "baps-swaminarayan-mandir" },
    data: {
      name: "BAPS Community Hall",
      capacity: 3000,
      images: BAPS_IMAGES,
    },
  });
  console.log(
    `Updated venue: ${venue.name} (${venue.capacity.toLocaleString()} capacity) — ${venue.images.length} images`
  );
}

main()
  .catch((error) => {
    console.error("Failed to update venue:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
