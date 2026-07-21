import "dotenv/config";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

if (existsSync(".env.development.local")) {
  dotenv.config({ path: ".env.development.local", override: true });
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("organizer123", 12);
  await prisma.user.upsert({
    where: { email: "events@techhub.africa" },
    update: {
      passwordHash,
      name: "TechHub Africa Organizer",
      company: "TechHub Africa",
      role: "ORGANIZER",
      isVerified: true,
    },
    create: {
      name: "TechHub Africa Organizer",
      email: "events@techhub.africa",
      passwordHash,
      role: "ORGANIZER",
      company: "TechHub Africa",
      isVerified: true,
    },
  });
  console.log("TechHub organizer account ensured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
