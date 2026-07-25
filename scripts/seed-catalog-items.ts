import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_ADDITIONAL_CATALOG_GROUPS } from "../src/lib/item-master-catalog";

// Match Next.js / prisma.config load order (later overrides).
config({ path: ".env", override: true });
config({ path: ".env.local", override: true });
config({ path: ".env.development", override: true });
config({ path: ".env.development.local", override: true });

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
      select: { id: true },
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
  const slug = process.argv[2] ?? "test-expo";
  const event = await prisma.event.findFirst({
    where: { slug },
    select: { id: true, title: true, slug: true },
  });
  if (!event) {
    const published = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    console.error(`Event not found: ${slug}`);
    console.error(
      "Published:",
      published.map((e) => e.slug).join(", ") || "(none)"
    );
    process.exit(1);
  }

  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)\//)?.[1];
  console.log(`DB: ${host}`);
  console.log(`Seeding additional catalog for "${event.title}" (${event.slug})…`);

  let sortOffset = 0;
  for (const group of DEFAULT_ADDITIONAL_CATALOG_GROUPS) {
    console.log(`\n${group.category}:`);
    await upsertCatalogGroup(event.id, group.category, group.items, sortOffset);
    sortOffset += group.items.length;
  }

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
