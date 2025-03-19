import { NextResponse } from "next/server";
import { handleRequest } from "@/lib/http/request";

export async function middleware(request) {
  const token = request.cookies.get("auth_token");
  const isAuthenticated = await verifyToken(token, request.nextUrl.origin);

  // If logged in, redirect login page to homepage
  if (request.nextUrl.pathname === "/login") {
    return isAuthenticated
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  // Exclude auth routes
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check login status
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // If not logged in, return with different response
  if (request.nextUrl.pathname.startsWith("/api")) {
    // For API routes, return 401 Unauthorized
    return NextResponse.json({ code: 401, message: "Unauthorized" }, { status: 401 });
  } else {
    // For other routes, redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Check token availability
async function verifyToken(token, origin) {
  if (!token) return false;
  const result = await handleRequest("POST", `${origin}/api/auth/verify`, { token }, "", false);
  return result;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/anime",
    "/downloads",
    "/login",
    "/settings/:path*",
  ],
}
