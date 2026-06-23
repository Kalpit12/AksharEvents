"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema, bookingSchema, reviewSchema, bookingInquirySchema, exhibitorRegisterSchema } from "@/lib/validations";
import { generateBookingNumber, slugify } from "@/lib/utils";
import { generateQRCodeDataUrl, getTicketQRPayload } from "@/lib/qr";
import { sendTicketConfirmation, sendWelcomeEmail, sendBookingInquiryEmail } from "@/lib/email";
import { createCheckoutSession, isStripeEnabled } from "@/lib/stripe";
import { createAuditLog } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { nanoid } from "nanoid";
import type { EventStatus } from "@prisma/client";

export async function registerUser(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: (formData.get("role") as "ATTENDEE" | "ORGANIZER") || "ATTENDEE",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Email already registered" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  try {
    await sendWelcomeEmail(user.email, user.name || "there");
  } catch (error) {
    console.error("Welcome email failed after user registration:", error);
  }

  try {
    await createAuditLog({ userId: user.id, action: "CREATE", entity: "User", entityId: user.id });
  } catch (error) {
    console.error("Audit log failed after user registration:", error);
  }

  return { success: true };
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

export async function registerExhibitor(formData: FormData) {
  try {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    companyName: formData.get("companyName") as string,
    products: formData.get("products") as string,
    description: (formData.get("description") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
  };

  const parsed = exhibitorRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const products = parsed.data.products
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (products.length === 0) {
    return { error: "List at least one product or service" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Email already registered" };

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
        members: {
          create: {
            userId: createdUser.id,
            role: "OWNER",
          },
        },
      },
    });

    return createdUser;
  });

  try {
    await sendWelcomeEmail(user.email, user.name || "there");
  } catch (error) {
    console.error("Welcome email failed after exhibitor registration:", error);
  }

  try {
    await createAuditLog({ userId: user.id, action: "CREATE", entity: "Exhibitor", entityId: user.id });
  } catch (error) {
    console.error("Audit log failed after exhibitor registration:", error);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    console.error("Auto sign-in failed after exhibitor registration:", error);
    return { success: true, requiresLogin: true };
  }

  return { success: true };
  } catch (error) {
    console.error("registerExhibitor failed:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { error: "Email already registered" };
    }
    return { error: "Could not create exhibitor account. Please try again." };
  }
}

export async function loginExhibitor(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      exhibitorProfile: true,
      exhibitorMemberships: { take: 1 },
    },
  });

  if (!user?.passwordHash) return { error: "Invalid email or password" };
  if (user.role === "ADMIN") {
    return { error: "Use Event Master sign in for admin accounts." };
  }
  if (!user.exhibitorProfile && user.exhibitorMemberships.length === 0) {
    return { error: "No exhibitor account found for this email. Create an exhibitor account first." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "Invalid email or password" };
  }
}

export async function loginAdmin(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user?.passwordHash) return { error: "Invalid email or password" };
  if (user.role !== "ADMIN") {
    return { error: "Event Master access only. Use the exhibitor portal to sign in as an exhibitor." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "Invalid email or password" };
  }
}

/** @deprecated Use loginAdmin or loginExhibitor */
export async function loginUser(formData: FormData) {
  return loginAdmin(formData);
}

export async function createBooking(data: {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  couponCode?: string;
}) {
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await getCurrentUser();
  const event = await prisma.event.findUnique({
    where: { id: data.eventId, status: "PUBLISHED" },
    include: { ticketTypes: { where: { isActive: true } } },
  });

  if (!event) return { error: "Event not found" };

  let discountAmount = 0;
  let couponId: string | undefined;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: data.couponCode.toUpperCase(),
        isActive: true,
        OR: [{ eventId: event.id }, { eventId: null }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
      },
    });

    if (coupon && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
      couponId = coupon.id;
    }
  }

  const bookingItems: { ticketTypeId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
  let totalAmount = 0;

  for (const item of data.items) {
    const ticketType = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!ticketType) return { error: "Invalid ticket type" };
    if (ticketType.sold + item.quantity > ticketType.quantity) {
      return { error: `Not enough ${ticketType.name} tickets available` };
    }

    const unitPrice = ticketType.price.toNumber();
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    bookingItems.push({ ticketTypeId: item.ticketTypeId, quantity: item.quantity, unitPrice, subtotal });
  }

  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (coupon) {
      if (coupon.discountType === "percentage") {
        discountAmount = totalAmount * (coupon.discountValue.toNumber() / 100);
      } else {
        discountAmount = coupon.discountValue.toNumber();
      }
      totalAmount = Math.max(0, totalAmount - discountAmount);
    }
  }

  const bookingNumber = generateBookingNumber();
  const qrPayload = getTicketQRPayload(bookingNumber, event.id);
  const qrCode = nanoid(24);

  const booking = await prisma.booking.create({
    data: {
      bookingNumber,
      status: totalAmount === 0 ? "CONFIRMED" : "PENDING",
      totalAmount,
      discountAmount,
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      attendeePhone: data.attendeePhone,
      qrCode,
      userId: user?.id,
      eventId: event.id,
      couponId,
      items: {
        create: bookingItems.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      },
    },
    include: { items: { include: { ticketType: true } } },
  });

  for (const item of data.items) {
    await prisma.ticketType.update({
      where: { id: item.ticketTypeId },
      data: { sold: { increment: item.quantity } },
    });
  }

  if (couponId) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  if (totalAmount === 0) {
    const qrDataUrl = await generateQRCodeDataUrl(qrPayload);
    await sendTicketConfirmation({
      to: data.attendeeEmail,
      name: data.attendeeName,
      eventTitle: event.title,
      bookingNumber,
      qrCodeUrl: qrDataUrl,
      totalAmount: "0",
      currency: "KES",
    });

    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "BOOKING_CONFIRMED",
          title: "Booking Confirmed",
          message: `Your tickets for ${event.title} are confirmed.`,
          link: `/dashboard/bookings`,
        },
      });
    }

    revalidatePath(`/events/${event.slug}`);
    return { success: true, bookingId: booking.id, bookingNumber, free: true };
  }

  if (isStripeEnabled()) {
    const session = await createCheckoutSession({
      bookingId: booking.id,
      bookingNumber,
      items: booking.items.map((item) => ({
        name: `${event.title} — ${item.ticketType.name}`,
        quantity: item.quantity,
        unitAmount: item.unitPrice.toNumber(),
      })),
      customerEmail: data.attendeeEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?booking=${bookingNumber}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}`,
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        status: "PENDING",
        stripeSessionId: session.id,
        invoiceNumber: `INV-${bookingNumber}`,
      },
    });

    return { success: true, bookingId: booking.id, checkoutUrl: session.url };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: totalAmount,
      status: "COMPLETED",
      invoiceNumber: `INV-${bookingNumber}`,
    },
  });

  const qrDataUrl = await generateQRCodeDataUrl(qrPayload);
  await sendTicketConfirmation({
    to: data.attendeeEmail,
    name: data.attendeeName,
    eventTitle: event.title,
    bookingNumber,
    qrCodeUrl: qrDataUrl,
    totalAmount: totalAmount.toString(),
    currency: "KES",
  });

  return { success: true, bookingId: booking.id, bookingNumber };
}

export async function toggleFavorite(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in" };

  const existing = await prisma.favorite.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/saved");
    return { success: true, favorited: false };
  }

  await prisma.favorite.create({ data: { userId: user.id, eventId } });
  revalidatePath("/dashboard/saved");
  return { success: true, favorited: true };
}

export async function submitReview(data: { eventId: string; rating: number; comment?: string }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in" };

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const hasBooking = await prisma.booking.findFirst({
    where: { userId: user.id, eventId: data.eventId, status: "CONFIRMED" },
  });

  if (!hasBooking) return { error: "You must attend the event to leave a review" };

  await prisma.review.upsert({
    where: { eventId_userId: { eventId: data.eventId, userId: user.id } },
    create: {
      eventId: data.eventId,
      userId: user.id,
      rating: data.rating,
      comment: data.comment,
      status: "PENDING",
    },
    update: { rating: data.rating, comment: data.comment, status: "PENDING" },
  });

  return { success: true };
}

export async function verifyTicket(qrData: string, eventId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  let payload: { booking?: string; event?: string };
  try {
    payload = JSON.parse(qrData);
  } catch {
    return { error: "Invalid QR code" };
  }

  if (payload.event !== eventId) return { error: "Ticket is for a different event" };

  const booking = await prisma.booking.findFirst({
    where: { bookingNumber: payload.booking, eventId, status: "CONFIRMED" },
    include: {
      items: { include: { ticketType: true } },
      attendance: true,
    },
  });

  if (!booking) return { error: "Ticket not found or not confirmed" };

  if (booking.checkedIn || booking.attendance) {
    return {
      success: true,
      alreadyCheckedIn: true,
      booking: {
        number: booking.bookingNumber,
        name: booking.attendeeName,
        email: booking.attendeeEmail,
        checkedInAt: booking.checkedInAt || booking.attendance?.checkedInAt,
      },
    };
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    }),
    prisma.attendance.create({
      data: { bookingId: booking.id, checkedInBy: user.id },
    }),
  ]);

  await createAuditLog({
    userId: user.id,
    action: "CHECK_IN",
    entity: "Booking",
    entityId: booking.id,
  });

  return {
    success: true,
    alreadyCheckedIn: false,
    booking: {
      number: booking.bookingNumber,
      name: booking.attendeeName,
      email: booking.attendeeEmail,
      tickets: booking.items.map((i) => `${i.quantity}x ${i.ticketType.name}`),
    },
  };
}

export async function subscribeNewsletter(email: string) {
  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { isActive: true },
    });
    return { success: true };
  } catch {
    return { error: "Failed to subscribe" };
  }
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    return { error: "Unauthorized" };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  if (user.role === "ORGANIZER" && event.organizerId !== user.id) {
    return { error: "Unauthorized" };
  }

  await prisma.event.update({ where: { id: eventId }, data: { status } });
  revalidatePath("/admin/events");
  revalidatePath("/organizer/events");
  return { success: true };
}

export async function submitBookingInquiry(formData: FormData) {
  const serviceLabels: Record<string, string> = {
    catering: "Catering",
    "av-equipment": "AV Equipment",
    photography: "Photography & Video",
    staffing: "Event Staffing",
    "full-management": "Full Event Management",
    brandings: "Brandings",
    hoardings: "Hoardings",
    "logistics-transport": "Logistics & Transport",
  };

  const raw = {
    eventType: formData.get("eventType") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    expectedAttendees: formData.get("expectedAttendees") as string,
    additionalServices: formData.getAll("additionalServices").map(String),
    title: formData.get("title") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    contactNumber: (formData.get("contactNumber") as string) || undefined,
    organization: formData.get("organization") as string,
    country: formData.get("country") as string,
    message: formData.get("message") as string,
  };

  const parsed = bookingInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const additionalServices = parsed.data.additionalServices?.map(
      (service) => serviceLabels[service] ?? service
    );
    await sendBookingInquiryEmail({ ...parsed.data, additionalServices });
    return { success: true };
  } catch {
    return { error: "Failed to send inquiry. Please try again or email hello@aksharevents.com." };
  }
}
