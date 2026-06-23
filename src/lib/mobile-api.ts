import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBearerToken, verifyMobileToken } from "@/lib/mobile-auth";
import type { UserRole } from "@prisma/client";

export async function getMobileUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;

  const payload = await verifyMobileToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      phone: true,
      company: true,
      isVerified: true,
    },
  });
}

export async function requireMobileUser(request: Request, ...roles: UserRole[]) {
  const user = await getMobileUser(request);
  if (!user) return null;
  if (roles.length > 0 && !roles.includes(user.role)) return null;
  return user;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
