"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function uniquePartnerSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;
  while (await prisma.partner.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
}

export async function createAdminPartner(formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#0D9488").trim();

  if (!name) return { error: "Partner name is required" };

  const slug = slugInput ? slugify(slugInput) : await uniquePartnerSlug(name);

  await prisma.partner.create({
    data: {
      name,
      slug,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      primaryColor,
      secondaryColor: String(formData.get("secondaryColor") ?? "").trim() || null,
      accentColor: String(formData.get("accentColor") ?? "").trim() || null,
      contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
      aboutHtml: String(formData.get("aboutHtml") ?? "").trim() || null,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePath("/admin/partners");
  return { success: true, slug };
}

export async function updateAdminPartner(partnerId: string, formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      primaryColor: String(formData.get("primaryColor") ?? "#0D9488").trim(),
      secondaryColor: String(formData.get("secondaryColor") ?? "").trim() || null,
      accentColor: String(formData.get("accentColor") ?? "").trim() || null,
      contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
      aboutHtml: String(formData.get("aboutHtml") ?? "").trim() || null,
      isActive: formData.get("isActive") === "true",
    },
  });

  revalidatePath("/admin/partners");
  return { success: true };
}

export async function assignEventPartner(eventId: string, partnerId: string | null) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  await prisma.event.update({
    where: { id: eventId },
    data: { partnerId: partnerId || null },
  });

  revalidatePath("/admin/partners");
  revalidatePath("/admin/events");
  return { success: true };
}
