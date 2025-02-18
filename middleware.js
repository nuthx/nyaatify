import { NextResponse } from "next/server";
import { handleRequest } from "@/lib/handlers";

export async function middleware(request) {
  // Do not need to authenticate paths
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the token exists
  const token = request.cookies.get("auth_token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check login status
  const verifyUrl = `${request.nextUrl.origin}/api/auth/verify`;
  const result = await handleRequest("POST", verifyUrl, JSON.stringify({ token }));
  if (result.success) {
    return NextResponse.next();
  }

  // If not logged in, return with different response
  if (request.nextUrl.pathname.startsWith("/api")) {
    // For API routes, return 401 Unauthorized
    return NextResponse.json({ code: 401, message: "Unauthorized", data: null }, { status: 401 });
  } else {
    // For other routes, redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  // Match all paths except _next/static and favicon.ico
  matcher: [
    "/((?!_next/static|favicon.ico).*)",
  ],
}
