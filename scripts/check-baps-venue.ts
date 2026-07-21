import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.findUnique({
    where: { slug: "baps-swaminarayan-mandir" },
    select: { id: true, name: true, images: true, updatedAt: true },
  });
  console.log(JSON.stringify(venue, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
