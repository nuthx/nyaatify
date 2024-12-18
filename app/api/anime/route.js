import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  try {
    const anime = await db.all(`
      SELECT a.*, GROUP_CONCAT(r.name) as rss_names
      FROM anime a
      LEFT JOIN anime_rss ar ON a.guid = ar.anime_id
      LEFT JOIN rss r ON ar.rss_id = r.id
      GROUP BY a.guid
      ORDER BY a.date DESC 
      LIMIT 50
    `);
    return Response.json({
      code: 200,
      message: "success",
      data: anime
    });
  }
  
  catch (error) {
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
