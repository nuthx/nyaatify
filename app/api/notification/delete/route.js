import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a notification
// Body: {
//   values: {
//     name: string, required
//   }
// }

export async function DELETE(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if notification exists
    const notification = await db.get("SELECT * FROM notification WHERE name = ?", data.values.name);
    if (!notification) {
      throw new Error(`Notification not found, name: ${data.values.name}`);
    }

    // Delete notification by name
    await db.run("DELETE FROM notification WHERE name = ?", data.values.name);

    logger.info(`Notification deleted successfully, name: ${data.values.name}`, { model: "DELETE /api/notification/delete" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/notification/delete" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
