import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export function middleware(request) {
  // Do not need to authenticate paths
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check login status
  const isLoggedIn = auth(request)
  if (!isLoggedIn) {
    // For API routes, return 401 Unauthorized
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({
        code: 401,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    // For other routes, redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except _next/static and favicon.ico
  matcher: [
    "/((?!_next/static|favicon.ico).*)",
  ],
}
