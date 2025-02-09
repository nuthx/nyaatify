import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a notification
// Params: name, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const name = (await params).name;

    // Check if notification exists
    const notification = await db.get("SELECT * FROM notification WHERE name = ?", name);
    if (!notification) {
      throw new Error(`Notification not found, name: ${name}`);
    }

    // Delete notification by name
    await db.run("DELETE FROM notification WHERE name = ?", name);

    logger.info(`Notification deleted successfully, name: ${name}`, { model: "DELETE /api/notification/[name]" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/notification/[name]" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}