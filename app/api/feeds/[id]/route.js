import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stopTask } from "@/lib/schedule";

// Delete a rss subscription
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const id = (await params).id;

    // Check if RSS is running
    const rss = await db.get("SELECT * FROM rss WHERE id = ?", [id]);
    if (rss.state === "running") {
      throw new Error(`RSS subscription is refreshing, deletion not possible, id: ${id}`);
    }

    // Stop RSS task
    await stopTask(rss.name);

    // Use try-catch because we need to monitor the transaction result
    await db.run("BEGIN TRANSACTION");
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

      await db.run("COMMIT");
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }

    logger.info(`Delete RSS subscription successfully, id: ${id}`, { model: "DELETE /api/feeds/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/feeds/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
