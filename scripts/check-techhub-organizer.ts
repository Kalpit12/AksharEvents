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
  const email = "events@techhub.africa";
  const user = await prisma.user.findUnique({ where: { email } });
  const partner = await prisma.partner.findFirst({
    where: { slug: "techhub-africa" },
    select: { contactEmail: true },
  });

  console.log("DATABASE_URL host:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown");
  console.log("user:", user ? { email: user.email, role: user.role, hasHash: Boolean(user.passwordHash) } : "NOT FOUND");
  console.log("partner contact:", partner?.contactEmail);

  if (user?.passwordHash) {
    for (const pw of ["organizer123", "password123", "admin123"]) {
      console.log(`password ${pw}:`, await bcrypt.compare(pw, user.passwordHash));
    }
  }
}

main()
  .finally(() => prisma.$disconnect());
