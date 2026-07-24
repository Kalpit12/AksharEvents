import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

function withDatabaseUrlParams(url: string, params: Record<string, string>) {
  const [base, query = ""] = url.split("?");
  const searchParams = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }
  return `${base}?${searchParams.toString()}`;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const pooledUrl =
    databaseUrl && process.env.NODE_ENV !== "production"
      ? withDatabaseUrlParams(databaseUrl, {
          // Keep concurrency modest in local/dev; Next.js RSC + layout queries need headroom.
          connection_limit: "5",
          pool_timeout: "60",
          connect_timeout: "60",
        })
      : databaseUrl;

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(pooledUrl ? { datasources: { db: { url: pooledUrl } } } : {}),
  });
}

function getPrismaErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

/** Missing table/column/enum — production DB not yet synced with schema.prisma */
export function isPrismaSchemaDriftError(error: unknown): boolean {
  const code = getPrismaErrorCode(error);
  if (code === "P2021" || code === "P2022") {
    return true;
  }
  if (!(error instanceof Error)) return false;
  if (error.name === "PrismaClientValidationError") {
    return true;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("invalid input value for enum") ||
    message.includes("unknown field") ||
    message.includes("exhibitorbadgecheckin") ||
    message.includes("badge_photo") ||
    message.includes("badgecheckins") ||
    message.includes("boothvisit") ||
    message.includes("boothkiosk")
  );
}

export function isTransientConnectionError(error: unknown): boolean {
  const code = getPrismaErrorCode(error);
  if (code && TRANSIENT_PRISMA_CODES.has(code)) {
    return true;
  }
  if (error instanceof Error && error.name === "PrismaClientInitializationError") {
    return true;
  }
  if (error instanceof Error && error.name === "PrismaClientUnknownRequestError") {
    return error.message.toLowerCase().includes("engine is not yet connected");
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("engine is not yet connected") ||
    message.includes("terminating connection") ||
    message.includes("connection terminated") ||
    message.includes("can't reach database server") ||
    message.includes("connection reset") ||
    message.includes("connection closed") ||
    message.includes("server has closed the connection") ||
    message.includes("kind: closed") ||
    message.includes("forcibly closed") ||
    message.includes("e57p01") ||
    message.includes("connection pool") ||
    message.includes("pool timeout")
  );
}

export let prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function refreshPrismaConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {
    // Pool may already be torn down.
  }
  await prisma.$connect();
}

function isInitializationError(error: unknown): boolean {
  return error instanceof Error && error.name === "PrismaClientInitializationError";
}

export function recreatePrismaClient(): PrismaClient {
  const previous = globalForPrisma.prisma;
  const next = createPrismaClient();
  globalForPrisma.prisma = next;
  prisma = next;
  void previous?.$disconnect().catch(() => {});
  return next;
}

export async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts?: number): Promise<T> {
  const attempts =
    maxAttempts ?? (process.env.NODE_ENV === "development" ? 8 : 5);
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$connect();
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientConnectionError(error) || attempt === attempts) {
        throw error;
      }
      if (
        isInitializationError(error) ||
        (error instanceof Error &&
          error.message.toLowerCase().includes("engine is not yet connected"))
      ) {
        recreatePrismaClient();
      } else {
        try {
          await refreshPrismaConnection();
        } catch {
          // Next attempt may still succeed after pool recreation.
        }
      }
      // Neon free tier can take 15–25s to wake from suspend.
      const delayMs = Math.min(attempt * 4000, 20000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
