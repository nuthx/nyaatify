import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Login in with username and password
// Body: {
//   values: {
//     username: string, required
//     password: string, required
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();
    const user = await db.get("SELECT * FROM user WHERE username = ?", [data.values.username]);

    // Check user
    if (!user) {
      logger.error(`Invalid username: ${data.values.username}`, { model: "POST /api/auth/login" });
      return Response.json({
        code: 401,
        message: "Invalid username or password"
      }, { status: 401 });
    }

    // Check password
    if (user.password !== data.values.password) {
      logger.error(`Invalid password, username: ${data.values.username}`, { model: "POST /api/auth/login" });
      return Response.json({
        code: 401,
        message: "Invalid username or password"
      }, { status: 401 });
    }

    // Create user token
    const token = crypto.createHash("sha256").update(user.password + user.username + Date.now().toString()).digest("hex");

    // Get user agent
    const ua = UAParser(request.headers.get("user-agent"));

    // Check if client is browser
    // Write new token to database
    if (ua.browser.name) {
      await db.run(
        "INSERT INTO device (token, user_id, browser, os, ip, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          token,
          user.id,
          `${ua.browser.name || ""} ${ua.browser.version || ""}`,
          `${ua.os.name || ""} ${ua.os.version || ""}`,
          request.headers.get("x-forwarded-for") || "",
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } else {
      logger.warn(`Non-browser login, token will not be stored in database, user agent: ${ua.ua}`, { model: "POST /api/auth/login" });
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "auth_token",
      value: token,
      sameSite: "strict",
      expires: new Date(Date.now() + 365 * 86400 * 1000) // 1 year
    });

    logger.info(`User logged in, username: ${user.username}`, { model: "POST /api/auth/login" });
    return Response.json({
      code: 200,
      message: "success",
      data: {
        token: token
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/auth/login" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
