// Prisma config for this repo.
// Important: Next.js loads env files with higher priority than `.env`.
// We mirror that here so `prisma db push` targets the same DB as `next dev`.
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

function loadEnvFiles() {
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const candidates =
    nodeEnv === "development"
      ? [".env", ".env.local", ".env.development", ".env.development.local"]
      : [".env", ".env.local", `.env.${nodeEnv}`, `.env.${nodeEnv}.local`];

  for (const file of candidates) {
    const full = path.join(cwd, file);
    if (!fs.existsSync(full)) continue;
    dotenv.config({ path: full, override: true });
  }
}

loadEnvFiles();

// schema.prisma uses directUrl for db push. Vercel Neon dev env often only sets DATABASE_URL_UNPOOLED.
const unpooledUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING;
if (unpooledUrl) {
  process.env.DIRECT_URL = unpooledUrl;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
