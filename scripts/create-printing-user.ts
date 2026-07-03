import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "printing@axarevents.com" },
    update: {
      role: "PRINTING_STAFF",
      passwordHash,
      name: "Printing Team",
      isVerified: true,
    },
    create: {
      name: "Printing Team",
      email: "printing@axarevents.com",
      passwordHash,
      role: "PRINTING_STAFF",
      company: "AxarEvents Print & Artwork",
      isVerified: true,
    },
  });
  console.log(`Printing account ready: ${user.email} (${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
