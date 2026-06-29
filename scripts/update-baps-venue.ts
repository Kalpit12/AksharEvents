import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.update({
    where: { slug: "baps-swaminarayan-mandir" },
    data: { name: "BAPS Community Hall", capacity: 3000 },
  });
  console.log(`Updated venue: ${venue.name} (${venue.capacity.toLocaleString()} capacity)`);
}

main()
  .catch((error) => {
    console.error("Failed to update venue:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
