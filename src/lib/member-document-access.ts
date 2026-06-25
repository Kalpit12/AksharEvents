import { prisma } from "@/lib/prisma";

type AuthUser = { id: string; role: string };

export async function assertExhibitorEventAccess(user: AuthUser, eventExhibitorId: string) {
  if (user.role === "ADMIN") {
    const entry = await prisma.eventExhibitor.findUnique({ where: { id: eventExhibitorId } });
    if (!entry) return { ok: false as const, status: 404, error: "Event exhibitor not found" };
    return { ok: true as const };
  }

  const entry = await prisma.eventExhibitor.findFirst({
    where: {
      id: eventExhibitorId,
      exhibitor: {
        OR: [
          { userId: user.id },
          { members: { some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } } } },
        ],
      },
    },
  });

  if (!entry) {
    return { ok: false as const, status: 403, error: "Access denied" };
  }
  return { ok: true as const };
}
