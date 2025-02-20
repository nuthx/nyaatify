import crypto from "crypto";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

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
