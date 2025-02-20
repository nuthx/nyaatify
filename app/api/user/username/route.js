import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Get current username

export async function GET() {
  try {
    const db = await getDb();

    // Get current username
    const user = await db.get("SELECT username FROM user WHERE id = 1");

    return Response.json({
      code: 200,
      message: "success",
      data: {
        username: user.username
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/user/username" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Change username
// Body: {
//   values: {
//     new_username: string, required
//   }
// }

export async function PATCH(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if the new username is the same as the current username
    const user = await db.get("SELECT username FROM user WHERE id = 1");
    if (user.username === data.values.new_username) {
      throw new Error("New username is the same as the current username");
    }

    // Update username
    await db.run("UPDATE user SET username = ? WHERE id = 1", [data.values.new_username]);

    logger.info(`Username changed successfully, username: ${data.values.new_username}`, { model: "PATCH /api/user/username" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/user/username" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
