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
    logger.error(error.message, { model: "GET /api/users/username" });
    return Response.json({
      code: 500,
      message: error.message
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

    logger.info(`Change username successfully, username: ${data.values.new_username}`, { model: "PATCH /api/users/username" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/users/username" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
