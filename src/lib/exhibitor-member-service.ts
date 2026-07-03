import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  exhibitorMemberWelcomeEmailSubject,
  exhibitorMemberWelcomeEmailHtml,
} from "@/lib/email-templates/exhibitor-member-welcome";
import { sendExhibitorMemberWelcomeEmail } from "@/lib/email";
import type { ExhibitorMemberRole } from "@prisma/client";

export type MemberRowInput = {
  name: string;
  email: string;
  phone: string;
  memberRole?: ExhibitorMemberRole;
};

export type ProvisionMemberResult =
  | { status: "added"; email: string; name: string; phone: string; isNewAccount: boolean }
  | { status: "skipped"; email: string; reason: string }
  | { status: "failed"; email: string; reason: string };

function generateTemporaryPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars[bytes[i]! % chars.length];
  return pwd;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function resolveExhibitorEventName(exhibitorId: string): Promise<string> {
  const now = new Date();
  const upcoming = await prisma.eventExhibitor.findFirst({
    where: { exhibitorId, event: { startDate: { gte: now } } },
    include: { event: { select: { title: true } } },
    orderBy: { event: { startDate: "asc" } },
  });
  if (upcoming) return upcoming.event.title;

  const latest = await prisma.eventExhibitor.findFirst({
    where: { exhibitorId },
    include: { event: { select: { title: true } } },
    orderBy: { event: { startDate: "desc" } },
  });
  return latest?.event.title ?? "your event";
}

export function parseExhibitorMemberCsv(text: string): MemberRowInput[] {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  let startIdx = 0;
  const header = lines[0]!.toLowerCase();
  if (header.includes("email") && (header.includes("name") || header.includes("phone"))) {
    startIdx = 1;
  }

  const rows: MemberRowInput[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i]!
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""));
    if (parts.length < 3) continue;

    if (parts.length >= 4) {
      rows.push({
        name: `${parts[0]} ${parts[1]}`.trim(),
        email: parts[2]!,
        phone: parts[3]!,
      });
    } else {
      rows.push({
        name: parts[0]!,
        email: parts[1]!,
        phone: parts[2]!,
      });
    }
  }
  return rows;
}

export async function provisionExhibitorMember({
  exhibitorId,
  companyName,
  invitedByName,
  row,
  defaultRole = "STAFF",
}: {
  exhibitorId: string;
  companyName: string;
  invitedByName?: string;
  row: MemberRowInput;
  defaultRole?: ExhibitorMemberRole;
}): Promise<ProvisionMemberResult> {
  const email = normalizeEmail(row.email);
  const name = row.name.trim();
  const phone = row.phone.trim();
  const memberRole = row.memberRole ?? defaultRole;

  if (!name || name.length < 2) {
    return { status: "failed", email, reason: "Name must be at least 2 characters" };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "failed", email, reason: "Invalid email address" };
  }
  if (!phone || phone.length < 8) {
    return { status: "failed", email, reason: "Phone number must be at least 8 characters" };
  }

  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: exhibitorId },
    select: { userId: true, companyName: true },
  });
  if (!exhibitor) {
    return { status: "failed", email, reason: "Exhibitor company not found" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser?.id === exhibitor.userId) {
    return { status: "skipped", email, reason: "This email belongs to the company owner" };
  }

  const existingMember = existingUser
    ? await prisma.exhibitorMember.findUnique({
        where: {
          exhibitorId_userId: { exhibitorId, userId: existingUser.id },
        },
      })
    : null;

  if (existingMember) {
    return { status: "skipped", email, reason: "Already a team member" };
  }

  let plainPassword: string | undefined;
  let isNewAccount = false;

  try {
    if (existingUser) {
      await prisma.exhibitorMember.create({
        data: {
          exhibitorId,
          userId: existingUser.id,
          role: memberRole,
        },
      });
    } else {
      plainPassword = generateTemporaryPassword();
      isNewAccount = true;
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            phone,
            passwordHash,
            role: "ATTENDEE",
            company: companyName,
          },
        });

        await tx.exhibitorMember.create({
          data: {
            exhibitorId,
            userId: user.id,
            role: memberRole,
          },
        });
      });
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://axarevents.com"}/auth/exhibitor?mode=signin`;
    const eventName = await resolveExhibitorEventName(exhibitorId);
    const html = exhibitorMemberWelcomeEmailHtml({
      name: existingUser?.name || name,
      email,
      password: plainPassword,
      companyName,
      eventName,
      loginUrl,
      invitedByName,
    });

    await sendExhibitorMemberWelcomeEmail({
      to: email,
      subject: exhibitorMemberWelcomeEmailSubject(eventName),
      html,
    });

    return { status: "added", email, name: existingUser?.name || name, phone, isNewAccount };
  } catch (error) {
    console.error("provisionExhibitorMember failed:", error);
    return {
      status: "failed",
      email,
      reason: error instanceof Error ? error.message : "Failed to add member",
    };
  }
}
