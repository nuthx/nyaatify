import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendResponse } from "@/lib/http/response";

// Login in with username and password
// Body: {
//   username: string, required
//   password: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();
    const user = await prisma.user.findUnique({
      where: {
        username: data.username
      }
    });

    // Check user
    if (!user) {
      return sendResponse(request, {
        code: 401,
        message: "Invalid username or password",
        logMessage: `Invalid username: ${data.username}`
      });
    }

    // Check password
    if (user.password !== data.password) {
      return sendResponse(request, {
        code: 401,
        message: "Invalid username or password",
        logMessage: `Invalid password, username: ${data.username}`
      });
    }

    // Create JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Get user agent
    const ua = UAParser(request.headers).withClientHints();

    // Check if client is browser and store device info
    if (ua.browser.name) {
      await prisma.device.create({
        data: {
          token,
          browser: `${ua.browser.name || ""} ${ua.browser.version || ""}`,
          os: `${ua.os.name || ""} ${ua.os.version || ""}`,
          ip: request.headers.get("x-forwarded-for") || "",
          expiredAt: new Date(Date.now() + 30 * 86400 * 1000)  // 30 days
        }
      });
    } else {
      logger.warn(`Non-browser login, ua: ${ua.ua}`, { model: "POST /api/auth/login" });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      sameSite: "strict",
      expires: new Date(Date.now() + 30 * 86400 * 1000)  // 30 days
    });

    return sendResponse(request, {
      message: `User logged in, username: ${user.username}`,
      data: { token }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
