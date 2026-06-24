import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

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

export function isTransientConnectionError(error: unknown): boolean {
  const code = getPrismaErrorCode(error);
  if (code && TRANSIENT_PRISMA_CODES.has(code)) {
    return true;
  }
  if (error instanceof Error && error.name === "PrismaClientInitializationError") {
    return true;
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("terminating connection") ||
    message.includes("connection terminated") ||
    message.includes("can't reach database server") ||
    message.includes("connection reset") ||
    message.includes("connection closed") ||
    message.includes("server has closed the connection") ||
    message.includes("kind: closed") ||
    message.includes("forcibly closed") ||
    message.includes("e57p01")
  );
}

export async function refreshPrismaConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {
    // Pool may already be torn down.
  }
  await prisma.$connect();
}

export async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientConnectionError(error) || attempt === maxAttempts) {
        throw error;
      }
      try {
        await refreshPrismaConnection();
      } catch {
        // Next attempt may still succeed after pool recreation.
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
