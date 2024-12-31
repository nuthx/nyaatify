import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { stopTask } from "@/lib/schedule";

// Delete a RSS subscription
// Method: POST
// Body: {
//   id: number
//   name: string
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if RSS is running
    const rss = await db.get("SELECT * FROM rss WHERE id = ?", [data.id]);
    if (rss.state === "running") {
      return Response.json({
        code: 400,
        message: "RSS task is running"
      }, { status: 400 });
    }

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    // Find all related anime from rss_anime table
    const animesToDelete = await db.all(`
      SELECT anime_hash 
      FROM rss_anime ra1
      WHERE rss_id = ? 
      AND NOT EXISTS (
        SELECT 1 
        FROM rss_anime ra2 
        WHERE ra1.anime_hash = ra2.anime_hash 
        AND ra2.rss_id != ?
      )
    `, [data.id, data.id]);

    // Delete anime from rss_anime table
    await db.run("DELETE FROM rss_anime WHERE rss_id = ?", [data.id]);

    // Delete anime from anime table
    if (animesToDelete.length > 0) {
      const animeHashes = animesToDelete.map(a => `'${a.anime_hash}'`).join(",");
      await db.run(`DELETE FROM anime WHERE hash IN (${animeHashes})`);
    }

    // Delete RSS from RSS table
    await db.run("DELETE FROM rss WHERE id = ?", [data.id]);

    // Commit transaction
    await db.run("COMMIT");
    log.info(`RSS subscription deleted successfully, name: ${data.name}`);

    // Stop RSS task
    stopTask(data.name);

    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    // Rollback transaction
    await db.run("ROLLBACK");

    log.error(`Failed to delete RSS subscription: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
