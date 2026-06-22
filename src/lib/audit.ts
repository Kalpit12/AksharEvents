import { prisma } from "./prisma";
import type { AuditAction, Prisma } from "@prisma/client";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
    },
  });
}
