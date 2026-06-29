import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_ADDITIONAL_CATALOG_GROUPS } from "../src/lib/item-master-catalog";

const prisma = new PrismaClient();

async function upsertCatalogGroup(
  eventId: string,
  category: string,
  items: { name: string; unitCost: number }[],
  sortOffset: number
) {
  for (const [index, item] of items.entries()) {
    const existing = await prisma.eventItemMaster.findFirst({
      where: { eventId, name: item.name },
    });

    const data = {
      category,
      unitOfMeasure: "each",
      unitCost: item.unitCost,
      currency: "KES",
      sortOrder: sortOffset + index,
    };

    if (existing) {
      await prisma.eventItemMaster.update({ where: { id: existing.id }, data });
      console.log(`  ↻ [${category}] ${item.name} — KES ${item.unitCost.toLocaleString()}`);
    } else {
      await prisma.eventItemMaster.create({
        data: { eventId, name: item.name, ...data },
      });
      console.log(`  + [${category}] ${item.name} — KES ${item.unitCost.toLocaleString()}`);
    }
  }
}

async function main() {
  const slug = process.argv[2] ?? "kenya-career-expo-2026";
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    console.error(`Event not found: ${slug}`);
    process.exit(1);
  }

  console.log(`Seeding additional catalog for "${event.title}" (${slug})…`);

  let sortOffset = await prisma.eventItemMaster.count({ where: { eventId: event.id } });

  for (const group of DEFAULT_ADDITIONAL_CATALOG_GROUPS) {
    console.log(`\n${group.category}:`);
    const before = sortOffset;
    await upsertCatalogGroup(event.id, group.category, group.items, sortOffset);
    sortOffset = before + group.items.length;
  }

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
