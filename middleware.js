import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const token = request.cookies.get("auth_token");
  const isAuthenticated = await verifyToken(token);

  // Exclude auth routes
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Redirect login page by login status
  if (request.nextUrl.pathname === "/login") {
    return isAuthenticated 
      ? NextResponse.redirect(new URL("/anime", request.url))
      : NextResponse.next();
  }

  // If not logged in, return with different response
  if (!isAuthenticated) {
    return request.nextUrl.pathname.startsWith("/api")
      ? NextResponse.json({ code: 401, message: "Unauthorized", data: null }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

async function verifyToken(token) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token.value, secret);
    return true;
  } catch (error) {
    return false;
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/anime",
    "/anime/:path*",
    "/downloads",
    "/login",
    "/settings/:path*",
  ],
}
