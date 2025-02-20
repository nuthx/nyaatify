import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a device
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const id = (await params).id;

    // Check if device exists
    const device = await db.get("SELECT * FROM token WHERE id = ?", id);
    if (!device) {
      throw new Error(`Device not found, id: ${id}`);
    }

    // Delete device by id
    await db.run("DELETE FROM token WHERE id = ?", id);

    logger.info(`Device deleted successfully, id: ${id}`, { model: "DELETE /api/device/[id]" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/device/[id]" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
