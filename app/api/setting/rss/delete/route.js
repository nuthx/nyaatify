import { getDb } from "@/lib/db";

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // 1. Find anime related to this rss
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

    // 2. Delete anime_rss
    await db.run("DELETE FROM anime_rss WHERE rss_id = ?", [data.id]);

    // 3. Delete anime related to this rss
    if (animesToDelete.length > 0) {
      const animeIds = animesToDelete.map(a => a.anime_id).join(',');
      await db.run(`DELETE FROM anime WHERE guid IN (${animeIds})`);
    }

    // 4. Delete rss
    await db.run("DELETE FROM rss WHERE id = ?", [data.id]);
    await db.run('COMMIT');

    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    await db.run('ROLLBACK');

    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
