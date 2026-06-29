import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_BOOTH_ITEMS,
  ITEM_MASTER_CATEGORY_BOOTH,
} from "../src/lib/item-master-catalog";

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2] ?? "kenya-career-expo-2026";
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    console.error(`Event not found: ${slug}`);
    process.exit(1);
  }

  console.log(`Seeding booth packages for "${event.title}" (${slug})…`);

  for (const [index, booth] of DEFAULT_BOOTH_ITEMS.entries()) {
    const existing = await prisma.eventItemMaster.findFirst({
      where: { eventId: event.id, name: booth.name },
    });

    if (existing) {
      await prisma.eventItemMaster.update({
        where: { id: existing.id },
        data: {
          category: ITEM_MASTER_CATEGORY_BOOTH,
          unitOfMeasure: "each",
          unitCost: booth.unitCost,
          sortOrder: index,
        },
      });
      console.log(`  ↻ ${booth.name}`);
    } else {
      await prisma.eventItemMaster.create({
        data: {
          eventId: event.id,
          name: booth.name,
          category: ITEM_MASTER_CATEGORY_BOOTH,
          unitOfMeasure: "each",
          unitCost: booth.unitCost,
          currency: "KES",
          sortOrder: index,
        },
      });
      console.log(`  + ${booth.name}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
