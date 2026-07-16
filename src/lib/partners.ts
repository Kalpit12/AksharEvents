import { prisma, withDbRetry } from "@/lib/prisma";
import type { Partner } from "@prisma/client";
import type { CSSProperties } from "react";

export type PartnerPublic = Pick<
  Partner,
  | "id"
  | "name"
  | "slug"
  | "tagline"
  | "logoUrl"
  | "primaryColor"
  | "secondaryColor"
  | "accentColor"
  | "backgroundColor"
  | "foregroundColor"
  | "fontFamily"
  | "aboutHtml"
  | "contactEmail"
  | "contactPhone"
>;

export async function getPartnerBySlug(slug: string): Promise<PartnerPublic | null> {
  return withDbRetry(() =>
    prisma.partner.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        backgroundColor: true,
        foregroundColor: true,
        fontFamily: true,
        aboutHtml: true,
        contactEmail: true,
        contactPhone: true,
      },
    })
  );
}

export function partnerPath(slug: string, path = ""): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/p/${slug}${normalized}`;
}

export function getPartnerThemeStyle(partner: PartnerPublic): CSSProperties {
  const primary = partner.primaryColor;
  const secondary = partner.secondaryColor ?? partner.primaryColor;
  const mutedWarm = `color-mix(in oklab, ${primary} 11%, white)`;
  const mutedCool = `color-mix(in oklab, ${secondary} 9%, white)`;

  return {
    ["--partner-primary" as string]: primary,
    ["--partner-secondary" as string]: secondary,
    ["--partner-accent" as string]: partner.accentColor ?? secondary,
    ["--partner-background" as string]: partner.backgroundColor ?? "#ffffff",
    ["--partner-foreground" as string]: partner.foregroundColor ?? "#000000",
    ["--partner-muted-warm" as string]: mutedWarm,
    ["--partner-muted-cool" as string]: mutedCool,
    ["--partner-hero-dark" as string]: secondary,
    ...(partner.fontFamily ? { fontFamily: `"${partner.fontFamily}", system-ui, sans-serif` } : {}),
  };
}

export function partnerEventWhere(partnerId: string) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ partnerId: null }, { partnerId }],
  };
}

export async function isEventVisibleToPartner(eventId: string, partnerId: string): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, ...partnerEventWhere(partnerId) },
    select: { id: true },
  });
  return !!event;
}
