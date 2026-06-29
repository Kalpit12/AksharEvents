import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_EQUIPMENT_ITEMS,
  ITEM_MASTER_CATEGORY_EQUIPMENT,
} from "../src/lib/item-master-catalog";

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2] ?? "kenya-career-expo-2026";
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    console.error(`Event not found: ${slug}`);
    process.exit(1);
  }

  const boothCount = await prisma.eventItemMaster.count({ where: { eventId: event.id } });
  const baseSortOrder = boothCount;

  console.log(`Seeding equipment (Televisions & Displays) for "${event.title}" (${slug})…`);

  for (const [index, item] of DEFAULT_EQUIPMENT_ITEMS.entries()) {
    const existing = await prisma.eventItemMaster.findFirst({
      where: { eventId: event.id, name: item.name },
    });

    if (existing) {
      await prisma.eventItemMaster.update({
        where: { id: existing.id },
        data: {
          category: ITEM_MASTER_CATEGORY_EQUIPMENT,
          unitOfMeasure: "each",
          unitCost: item.unitCost,
          currency: "KES",
          sortOrder: baseSortOrder + index,
        },
      });
      console.log(`  ↻ ${item.name} — KES ${item.unitCost.toLocaleString()}`);
    } else {
      await prisma.eventItemMaster.create({
        data: {
          eventId: event.id,
          name: item.name,
          category: ITEM_MASTER_CATEGORY_EQUIPMENT,
          unitOfMeasure: "each",
          unitCost: item.unitCost,
          currency: "KES",
          sortOrder: baseSortOrder + index,
        },
      });
      console.log(`  + ${item.name} — KES ${item.unitCost.toLocaleString()}`);
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
