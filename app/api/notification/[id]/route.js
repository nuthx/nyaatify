import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a notification
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const id = (await params).id;

    // Check if notification exists
    const notification = await db.get("SELECT * FROM notification WHERE id = ?", id);
    if (!notification) {
      throw new Error(`Notification not found, id: ${id}`);
    }

    // Delete notification by id
    await db.run("DELETE FROM notification WHERE id = ?", id);

    logger.info(`Notification deleted successfully, id: ${id}`, { model: "DELETE /api/notification/[id]" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/notification/[id]" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Edit a notification
// Params: id, string, required
// Body: {
//   values: {
//     key1: value1,
//     key2: value2,
//     ...
//   }
// }

export async function PATCH(request, { params }) {
  try {
    const db = await getDb();
    const id = (await params).id;
    const data = await request.json();

    // Check if id exists
    const existingId = await db.get("SELECT id FROM notification WHERE id = ?", id);
    if (!existingId) {
      throw new Error(`Notification not found, id: ${id}`);
    }

    // Extract valid values
    const validValues = {};
    const fields = ["state"];
    fields.forEach(field => {
      if (data.values[field] !== undefined) validValues[field] = data.values[field];
    });

    // Use try-catch because we need to monitor the transaction result
    await db.run("BEGIN TRANSACTION");
    try {
      for (const [key, value] of Object.entries(validValues)) {
        await db.run(`UPDATE notification SET ${key} = ? WHERE id = ?`, [value, id]);
      }
      await db.run("COMMIT");
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }

    logger.info(`Notification edit successfully, id: ${id}`, { model: "PATCH /api/notification/[id]" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/notification/[id]" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
