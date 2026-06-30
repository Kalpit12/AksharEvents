import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/mobile-auth";
import { loginSchema, exhibitorRegisterSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { getOpenExhibitorEventById } from "@/lib/exhibitor-events";
import type { UserRole } from "@prisma/client";

const REGISTRATION_EXISTS_MESSAGE =
  "Could not create account. If you already have an account, sign in instead.";

async function uniqueExhibitorSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;
  while (await prisma.exhibitor.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
}

export async function mobileLogin(email: string, password: string, portal: "admin" | "exhibitor") {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      exhibitorProfile: true,
      exhibitorMemberships: { take: 1 },
    },
  });

  if (!user?.passwordHash) return { error: "Invalid email or password" };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  if (portal === "admin") {
    if (user.role !== "ADMIN") {
      return { error: "Event Master access only. Use exhibitor sign in for exhibitor accounts." };
    }
  } else {
    if (user.role === "ADMIN") {
      return { error: "Use Event Master sign in for admin accounts." };
    }
    if (!user.exhibitorProfile && user.exhibitorMemberships.length === 0) {
      return { error: "No exhibitor account found. Create an exhibitor account first." };
    }
  }

  const token = await signMobileToken({
    sub: user.id,
    role: user.role as UserRole,
    email: user.email,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      company: user.company,
    },
    redirect: portal === "admin" ? "/admin" : "/exhibitor",
  };
}

export async function mobileRegisterExhibitor(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  eventId: string;
  companyName: string;
  products: string;
  description?: string;
  website?: string;
}) {
  const parsed = exhibitorRegisterSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const products = parsed.data.products
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (products.length === 0) return { error: "List at least one product or service" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: REGISTRATION_EXISTS_MESSAGE };

  const event = await getOpenExhibitorEventById(parsed.data.eventId);
  if (!event) return { error: "Selected event is not open for exhibitor registration" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const slug = await uniqueExhibitorSlug(parsed.data.companyName);
  const website = parsed.data.website?.trim() || null;

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        phone: parsed.data.phone,
        company: parsed.data.companyName,
        role: "ATTENDEE",
      },
    });

    await tx.exhibitor.create({
      data: {
        userId: createdUser.id,
        companyName: parsed.data.companyName,
        slug,
        description: parsed.data.description?.trim() || null,
        website,
        contactName: parsed.data.name,
        contactEmail: parsed.data.email,
        contactPhone: parsed.data.phone,
        products,
        members: { create: { userId: createdUser.id, role: "OWNER" } },
        events: { create: { eventId: event.id } },
      },
    });

    return createdUser;
  });

  await sendWelcomeEmail(user.email, user.name || "there");
  await createAuditLog({ userId: user.id, action: "CREATE", entity: "Exhibitor", entityId: user.id });

  const token = await signMobileToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      company: user.company,
    },
    redirect: "/exhibitor",
  };
}
