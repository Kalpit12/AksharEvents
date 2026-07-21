"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import {
  sendPartnerExhibitorBoothReservedEmail,
  sendPartnerExhibitorPaymentAndAccessEmail,
} from "@/lib/email";
import { ensureEventFloorPlanBoothsInternal } from "@/lib/floor-plan-data";
import { FLOOR_PLAN_LAYOUT_BY_CODE } from "@/lib/floor-plan-layout";
import { partnerPath, partnerEventWhere } from "@/lib/partners";
import { EXHIBITOR_EVENT_FORMATS } from "@/lib/exhibitor-events";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function defaultStatusForCode(code: string) {
  return FLOOR_PLAN_LAYOUT_BY_CODE[code]?.defaultStatus ?? "AVAILABLE";
}

async function uniqueExhibitorSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;

  while (await prisma.exhibitor.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }

  return slug;
}

async function requirePartnerOrganizerAccess(partnerSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in required", user: null, partner: null };
  }

  const partner = await prisma.partner.findFirst({
    where: { slug: partnerSlug, isActive: true },
    select: { id: true, slug: true, name: true, contactEmail: true },
  });

  if (!partner) {
    return { error: "Partner not found", user: null, partner: null };
  }

  const isAdmin = user.role === "ADMIN";
  const isPartnerContact =
    normalizeEmail(partner.contactEmail) !== "" &&
    normalizeEmail(partner.contactEmail) === normalizeEmail(user.email);

  if (!isAdmin && !isPartnerContact) {
    return { error: "Organizer access denied", user: null, partner: null };
  }

  return { error: null, user, partner };
}

export async function loginPartnerOrganizer(formData: FormData) {
  const partnerSlug = String(formData.get("partnerSlug") || "").trim();
  const raw = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const parsed = loginSchema.safeParse({
    email: raw.email.trim().toLowerCase(),
    password: raw.password,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!partnerSlug) {
    return { error: "Partner not found." };
  }

  const partner = await prisma.partner.findFirst({
    where: { slug: partnerSlug, isActive: true },
    select: { contactEmail: true, name: true },
  });

  if (!partner) {
    return { error: "Partner not found." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user?.passwordHash) {
    return { error: "Invalid email or password." };
  }

  const isAdmin = user.role === "ADMIN";
  const isPartnerContact =
    normalizeEmail(partner.contactEmail) !== "" &&
    normalizeEmail(partner.contactEmail) === normalizeEmail(user.email);

  if (!isAdmin && !isPartnerContact) {
    return {
      error: `This account is not authorized for ${partner.name}. Use the organizer email on file for this partner.`,
    };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true as const };
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function loadPartnerOrganizerDashboard(partnerSlug: string) {
  const access = await requirePartnerOrganizerAccess(partnerSlug);
  if (access.error || !access.partner) {
    return {
      error: access.error ?? "Access denied",
      partner: null,
      events: [],
      rows: [],
      boothOptionsByEvent: {} as Record<string, { code: string; status: string; companyName: string | null }[]>,
    };
  }

  const [events, rows] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...partnerEventWhere(access.partner.id),
        format: { in: EXHIBITOR_EVENT_FORMATS },
      },
      select: { id: true, title: true, slug: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.eventExhibitor.findMany({
      where: {
        event: partnerEventWhere(access.partner.id),
      },
      include: {
        event: { select: { id: true, title: true, slug: true } },
        exhibitor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            contactEmail: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        eventBooth: {
          select: { code: true, status: true, paymentVerified: true, paymentVerifiedAt: true },
        },
      },
      orderBy: [{ event: { startDate: "asc" } }, { exhibitor: { companyName: "asc" } }],
    }),
  ]);

  const boothOptionsByEvent: Record<
    string,
    { code: string; status: string; companyName: string | null }[]
  > = {};

  for (const event of events) {
    await ensureEventFloorPlanBoothsInternal(event.id);
    const booths = await prisma.eventBooth.findMany({
      where: { eventId: event.id },
      select: { code: true, status: true, companyName: true },
      orderBy: { code: "asc" },
    });
    boothOptionsByEvent[event.id] = booths;
  }

  return { error: null, partner: access.partner, events, rows, boothOptionsByEvent };
}

function buildTempPassword() {
  return `Axar-${randomBytes(4).toString("hex")}`;
}

export async function createManualPartnerExhibitor(formData: FormData) {
  const partnerSlug = String(formData.get("partnerSlug") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const companyName = String(formData.get("companyName") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const contactEmail = normalizeEmail(String(formData.get("contactEmail") || ""));
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const boothCode = String(formData.get("boothCode") || "").trim().toUpperCase();

  const redirectBase = partnerPath(partnerSlug || "unknown", "/organizer");

  if (!partnerSlug || !eventId || !companyName || !contactName || !contactEmail || !boothCode) {
    redirect(`${redirectBase}?mail=error`);
  }

  if (!FLOOR_PLAN_LAYOUT_BY_CODE[boothCode]) {
    redirect(`${redirectBase}?mail=invalid-booth`);
  }

  const access = await requirePartnerOrganizerAccess(partnerSlug);
  if (access.error || !access.partner) {
    redirect(`${redirectBase}?mail=denied`);
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      ...partnerEventWhere(access.partner.id),
      format: { in: EXHIBITOR_EVENT_FORMATS },
    },
    select: { id: true, title: true },
  });
  if (!event) {
    redirect(`${redirectBase}?mail=invalid-event`);
  }

  await ensureEventFloorPlanBoothsInternal(event.id);

  const booth = await prisma.eventBooth.findUnique({
    where: { eventId_code: { eventId: event.id, code: boothCode } },
  });
  if (!booth) {
    redirect(`${redirectBase}?mail=invalid-booth`);
  }
  if (
    booth.status === "OCCUPIED" ||
    (booth.status === "RESERVED" && booth.eventExhibitorId)
  ) {
    redirect(`${redirectBase}?mail=booth-taken`);
  }

  const tempPassword = buildTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const exhibitorSlug = await uniqueExhibitorSlug(companyName);

  let eventExhibitorId: string;

  try {
    eventExhibitorId = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: contactEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            name: contactName,
            email: contactEmail,
            passwordHash,
            phone: contactPhone || null,
            company: companyName,
            role: "ATTENDEE",
          },
        });
      }

      let exhibitor = await tx.exhibitor.findFirst({
        where: { OR: [{ userId: user.id }, { contactEmail }] },
      });

      if (!exhibitor) {
        exhibitor = await tx.exhibitor.create({
          data: {
            userId: user.id,
            companyName,
            slug: exhibitorSlug,
            contactName,
            contactEmail,
            contactPhone: contactPhone || null,
            products: ["General"],
            members: {
              create: {
                userId: user.id,
                role: "OWNER",
              },
            },
          },
        });
      } else if (!exhibitor.userId) {
        await tx.exhibitor.update({
          where: { id: exhibitor.id },
          data: {
            userId: user.id,
            contactName: exhibitor.contactName ?? contactName,
            contactEmail: exhibitor.contactEmail ?? contactEmail,
            contactPhone: exhibitor.contactPhone ?? (contactPhone || null),
          },
        });
      }

      const existingEntry = await tx.eventExhibitor.findUnique({
        where: { eventId_exhibitorId: { eventId: event.id, exhibitorId: exhibitor.id } },
      });
      if (existingEntry) {
        throw new Error("ALREADY_REGISTERED");
      }

      const eventExhibitor = await tx.eventExhibitor.create({
        data: { eventId: event.id, exhibitorId: exhibitor.id },
      });

      await tx.eventBooth.update({
        where: { id: booth.id },
        data: {
          status: "RESERVED",
          eventExhibitorId: eventExhibitor.id,
          companyName,
          contactName,
          contactPhone: contactPhone || null,
          contactEmail,
          reservedAt: new Date(),
          paymentVerified: false,
          paymentVerifiedAt: null,
          paymentVerifiedBy: null,
        },
      });

      return eventExhibitor.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REGISTERED") {
      redirect(`${redirectBase}?mail=duplicate`);
    }
    redirect(`${redirectBase}?mail=error`);
  }

  await sendPartnerExhibitorBoothReservedEmail({
    to: contactEmail,
    exhibitorName: contactName,
    companyName,
    partnerName: access.partner.name,
    eventTitle: event.title,
    boothCode,
    contactEmail,
  });

  revalidatePath(partnerPath(partnerSlug, "/organizer"));
  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  redirect(`${redirectBase}?tab=list&mail=booth-sent`);
}

export async function sendPartnerExhibitorPaymentConfirmation(formData: FormData) {
  const partnerSlug = String(formData.get("partnerSlug") || "").trim();
  const eventExhibitorId = String(formData.get("eventExhibitorId") || "").trim();
  const paymentReference = String(formData.get("paymentReference") || "").trim();

  const redirectBase = partnerPath(partnerSlug || "unknown", "/organizer");

  if (!partnerSlug || !eventExhibitorId) {
    redirect(`${redirectBase}?mail=error`);
  }

  const access = await requirePartnerOrganizerAccess(partnerSlug);
  if (access.error || !access.partner || !access.user) {
    redirect(`${redirectBase}?mail=denied`);
  }

  const eventExhibitor = await prisma.eventExhibitor.findFirst({
    where: { id: eventExhibitorId, event: partnerEventWhere(access.partner.id) },
    include: {
      event: { select: { title: true } },
      exhibitor: {
        select: {
          companyName: true,
          contactName: true,
          contactEmail: true,
          user: { select: { id: true, email: true } },
        },
      },
      eventBooth: { select: { code: true, paymentVerified: true } },
    },
  });

  if (!eventExhibitor) {
    redirect(`${redirectBase}?mail=error`);
  }

  const loginEmail =
    eventExhibitor.exhibitor.user?.email?.trim() ||
    eventExhibitor.exhibitor.contactEmail?.trim() ||
    "";

  if (!loginEmail) {
    redirect(`${redirectBase}?mail=missing-user`);
  }

  const tempPassword = buildTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.$transaction(async (tx) => {
    if (eventExhibitor.exhibitor.user) {
      await tx.user.update({
        where: { id: eventExhibitor.exhibitor.user.id },
        data: { passwordHash },
      });
    } else {
      const user = await tx.user.create({
        data: {
          name: eventExhibitor.exhibitor.contactName ?? eventExhibitor.exhibitor.companyName,
          email: loginEmail,
          passwordHash,
          company: eventExhibitor.exhibitor.companyName,
          role: "ATTENDEE",
        },
      });
      await tx.exhibitor.update({
        where: { id: eventExhibitor.exhibitorId },
        data: { userId: user.id },
      });
      await tx.exhibitorMember.upsert({
        where: {
          exhibitorId_userId: {
            exhibitorId: eventExhibitor.exhibitorId,
            userId: user.id,
          },
        },
        create: {
          exhibitorId: eventExhibitor.exhibitorId,
          userId: user.id,
          role: "OWNER",
        },
        update: {},
      });
    }

    if (eventExhibitor.eventBooth?.code) {
      await tx.eventBooth.update({
        where: {
          eventId_code: {
            eventId: eventExhibitor.eventId,
            code: eventExhibitor.eventBooth.code,
          },
        },
        data: {
          paymentVerified: true,
          paymentVerifiedAt: new Date(),
          paymentVerifiedBy: access.user!.id,
          status: "OCCUPIED",
        },
      });

      await tx.eventExhibitor.update({
        where: { id: eventExhibitor.id },
        data: { boothNumber: eventExhibitor.eventBooth.code },
      });
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001";
  const loginUrl = `${appUrl}/auth/exhibitor`;
  const additionalServicesUrl = `${appUrl}/exhibitor`;
  const recipientEmail = eventExhibitor.exhibitor.contactEmail?.trim() || loginEmail;

  await sendPartnerExhibitorPaymentAndAccessEmail({
    to: recipientEmail,
    exhibitorName:
      eventExhibitor.exhibitor.contactName?.trim() ||
      eventExhibitor.exhibitor.companyName,
    companyName: eventExhibitor.exhibitor.companyName,
    partnerName: access.partner.name,
    eventTitle: eventExhibitor.event.title,
    boothCode: eventExhibitor.eventBooth?.code ?? eventExhibitor.boothNumber ?? "TBC",
    loginEmail,
    temporaryPassword: tempPassword,
    loginUrl,
    additionalServicesUrl,
    paymentReference: paymentReference || null,
  });

  revalidatePath(partnerPath(partnerSlug, "/organizer"));
  revalidatePath("/admin");
  revalidatePath("/exhibitor", "layout");
  redirect(`${redirectBase}?mail=sent`);
}
