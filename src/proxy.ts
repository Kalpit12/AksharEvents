import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const protectedRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/exhibitor": ["ADMIN", "ATTENDEE"],
};

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/organizer")) {
    return NextResponse.redirect(new URL(pathname.startsWith("/organizer") ? "/admin" : "/", req.url));
  }

  if (pathname.startsWith("/auth/register")) {
    return NextResponse.redirect(new URL("/auth/exhibitor", req.url));
  }

  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!session?.user) {
        const loginUrl = new URL(
          route.startsWith("/exhibitor") ? "/auth/exhibitor?mode=signin" : "/auth/login",
          req.url
        );
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const userRole = session.user.role;
      if (!roles.includes(userRole)) {
        if (userRole === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        if (userRole === "ATTENDEE") {
          return NextResponse.redirect(new URL("/exhibitor", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/exhibitor/:path*",
    "/dashboard/:path*",
    "/organizer/:path*",
    "/auth/register/:path*",
  ],
};
