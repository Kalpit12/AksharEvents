import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/** Resolve the public site URL; ignores localhost AUTH_URL on Vercel deploys. */
function resolveSiteUrl(fallback: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes("localhost")) {
    return appUrl.replace(/\/$/, "");
  }
  const authUrl = process.env.AUTH_URL;
  if (authUrl && !authUrl.includes("localhost")) {
    return authUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return fallback;
}

/**
 * Edge-safe auth config — no Prisma/bcrypt providers.
 * Used by middleware to stay under Vercel's Edge bundle size limit.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const siteUrl = resolveSiteUrl(baseUrl);
      if (url.startsWith("/")) return `${siteUrl}${url}`;
      try {
        const origin = new URL(url).origin;
        if (origin === siteUrl || origin === baseUrl) return url;
      } catch {
        // ignore malformed URLs
      }
      return siteUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
