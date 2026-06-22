import { PrismaClient } from "@prisma/client";

const urls = {
  userPooler:
    "postgresql://neondb_owner:npg_5Zky6uNCtwpI@ep-tiny-fire-at6ykfhw-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  userPoolerPrisma:
    "postgresql://neondb_owner:npg_5Zky6uNCtwpI@ep-tiny-fire-at6ykfhw-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15",
  direct:
    "postgresql://neondb_owner:npg_5Zky6uNCtwpI@ep-tiny-fire-at6ykfhw.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  env: process.env.DATABASE_URL ?? "",
};

async function testLabel(label: string, url: string) {
  if (!url) {
    console.log(`SKIP ${label}: no URL`);
    return;
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    const count = await prisma.exhibitorRegistration.count();
    console.log(`OK  ${label} (${Date.now() - t0}ms) — exhibitorRegistration: ${count}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${label} (${Date.now() - t0}ms): ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (const [label, url] of Object.entries(urls)) {
    await testLabel(label, url);
  }
}

main();
