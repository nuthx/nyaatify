import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a notification
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const id = (await params).id;

    // Delete notification by id
    await db.run("DELETE FROM notification WHERE id = ?", id);

    logger.info(`Delete notification successfully, id: ${id}`, { model: "DELETE /api/notifications/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/notifications/[id]" });
    return Response.json({
      code: 500,
      message: error.message
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

    logger.info(`Edit notification successfully, id: ${id}`, { model: "PATCH /api/notifications/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/notifications/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
