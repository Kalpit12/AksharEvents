import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const result = await prisma.ticketType.updateMany({
    where: { name: { in: ["General Admission", "Visitor Pass"] } },
    data: { name: "General Pass" },
  });

  console.log(`Updated ${result.count} ticket type(s) to General Pass`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
