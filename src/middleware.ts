import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/exhibitor": ["ADMIN", "ATTENDEE"],
};

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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
