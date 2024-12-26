import { getDb } from "@/lib/db";
import { refreshRSS } from "@/lib/schedule";
import { log } from "@/lib/log";

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
    // Start transaction
    await db.run("BEGIN TRANSACTION");

    // Find anime related to this rss
    const animesToDelete = await db.all(`
      SELECT anime_id 
      FROM anime_rss ar1
      WHERE rss_id = ? 
      AND NOT EXISTS (
        SELECT 1 
        FROM anime_rss ar2 
        WHERE ar1.anime_id = ar2.anime_id 
        AND ar2.rss_id != ?
      )
    `, [data.id, data.id]);

    // Delete anime_rss
    await db.run("DELETE FROM anime_rss WHERE rss_id = ?", [data.id]);

    // Delete anime related to this rss
    if (animesToDelete.length > 0) {
      const animeIds = animesToDelete.map(a => a.anime_id).join(",");
      await db.run(`DELETE FROM anime WHERE id IN (${animeIds})`);
    }

    // Delete rss
    await db.run("DELETE FROM rss WHERE id = ?", [data.id]);

    // Commit transaction
    await db.run("COMMIT");

    // Update RSS schedule
    log.info(`RSS subscription deleted successfully, name: ${data.name}`);
    await refreshRSS();

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
