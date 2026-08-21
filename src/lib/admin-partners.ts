"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { paletteFromForm, uploadPartnerLogo } from "@/lib/partner-logo";
import { partnerPath } from "@/lib/partners";
import type { LogoPalette } from "@/lib/logo-palette";

async function uniquePartnerSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;
  while (await prisma.partner.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
}

function getLogoFile(formData: FormData) {
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) return file;
  return null;
}

function resolvePalette(formData: FormData): LogoPalette {
  return paletteFromForm(formData);
}

function revalidatePartner(slug: string) {
  revalidatePath("/admin/partners");
  revalidatePath(partnerPath(slug), "layout");
}

export async function createAdminPartner(formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  if (!name) return { error: "Partner name is required" };

  const slug = slugInput ? slugify(slugInput) : await uniquePartnerSlug(name);
  const logoFile = getLogoFile(formData);

  let logoUrl: string | null = null;
  if (logoFile) {
    const upload = await uploadPartnerLogo(slug, logoFile);
    if ("error" in upload) return { error: upload.error };
    logoUrl = upload.url;
  }

  const palette = resolvePalette(formData);

  await prisma.partner.create({
    data: {
      name,
      slug,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      logoUrl,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      backgroundColor: palette.background,
      foregroundColor: palette.foreground,
      contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
      aboutHtml: String(formData.get("aboutHtml") ?? "").trim() || null,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePartner(slug);
  return { success: true, slug };
}

export async function updateAdminPartner(partnerId: string, formData: FormData) {
  const user = await requireRole("ADMIN");
  if (!user) return { error: "Unauthorized" };

  const existing = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { slug: true, logoUrl: true },
  });
  if (!existing) return { error: "Partner not found" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Partner name is required" };

  const logoFile = getLogoFile(formData);
  let logoUrl = existing.logoUrl;
  if (logoFile) {
    const upload = await uploadPartnerLogo(existing.slug, logoFile);
    if ("error" in upload) return { error: upload.error };
    logoUrl = upload.url;
  }

  const palette = resolvePalette(formData);

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      name,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      logoUrl,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      backgroundColor: palette.background,
      foregroundColor: palette.foreground,
      contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
      aboutHtml: String(formData.get("aboutHtml") ?? "").trim() || null,
      isActive: formData.get("isActive") === "true",
    },
  });

  revalidatePartner(existing.slug);
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
