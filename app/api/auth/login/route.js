import crypto from "crypto";
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

    // Create user token
    const token = crypto.createHash("sha256")
      .update(user.password + user.username + Date.now().toString())
      .digest("hex");

    // Get user agent
    const ua = UAParser(request.headers).withClientHints();

    // Check if client is browser and store device info
    if (ua.browser.name) {
      await prisma.device.create({
        data: {
          token,
          browser: `${ua.browser.name || ""} ${ua.browser.version || ""}`,
          os: `${ua.os.name || ""} ${ua.os.version || ""}`,
          ip: request.headers.get("x-forwarded-for") || ""
        }
      });
    } else {
      logger.warn(`Non-browser login, token will not be stored in database, user agent: ${ua.ua}`, { model: "POST /api/auth/login" });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 86400 * 1000) // 1 year
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
