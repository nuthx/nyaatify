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
      logger.error(`Invalid username: ${data.values.username}`, { model: "POST /api/auth" });
      return Response.json({
        code: 401,
        message: "Invalid username or password",
        data: null
      }, { status: 401 });
    }

    // Check password
    if (user.password !== data.values.password) {
      logger.error(`Invalid password, username: ${data.values.username}`, { model: "POST /api/auth" });
      return Response.json({
        code: 401,
        message: "Invalid username or password",
        data: null
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
        "INSERT INTO token (token, user_id, browser, os, ip, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
      logger.warn(`Token will not be stored in database due to non-browser login, user agent: ${ua.ua}`, { model: "POST /api/auth" });
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "auth_token",
      value: token,
      sameSite: "strict"
    });

    logger.info(`User logged in, username: ${user.username}`, { model: "POST /api/auth" });
    return Response.json({
      code: 200,
      message: "success",
      data: {
        token: token
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/auth" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Logout

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth_token");

    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/auth" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
