import { prisma, withDbRetry } from "@/lib/prisma";

export async function getPrimaryPublishedEvent() {
  return withDbRetry(() =>
    prisma.event.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
      include: {
        venue: { select: { name: true, city: true } },
      },
    })
  );
}
