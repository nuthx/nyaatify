import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stopTask } from "@/lib/schedule";

// Delete a rss subscription
// Body: {
//   values: {
//     name: string, required
//   }
// }

export async function DELETE(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if RSS is running
    const rss = await db.get("SELECT * FROM rss WHERE name = ?", [data.values.name]);
    if (rss.state === "running") {
      throw new Error(`Delete cancelled due to RSS subscription is running, name: ${data.values.name}`);
    }

    // Stop RSS task
    await stopTask(data.values.name);

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    // Use try-catch because we need to monitor the transaction result
    try {
      // Find and delete isolated anime records
      await db.run(`
        DELETE FROM anime 
        WHERE hash IN (
          SELECT DISTINCT ra1.anime_hash 
          FROM rss_anime ra1
          WHERE ra1.rss_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM rss_anime ra2 
            WHERE ra2.anime_hash = ra1.anime_hash 
            AND ra2.rss_id != ?
          )
        )
      `, [rss.id, rss.id]);

      // Delete anime from rss and rss_anime table
      await Promise.all([
        db.run("DELETE FROM rss WHERE id = ?", [rss.id]),
        db.run("DELETE FROM rss_anime WHERE rss_id = ?", [rss.id])
      ]);

      // Commit transaction
      await db.run("COMMIT");

      logger.info(`RSS subscription deleted successfully, name: ${data.values.name}`, { model: "DELETE /api/rss/delete" });
      return Response.json({
        code: 200,
        message: "success",
        data: null
      });
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/rss/delete" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
