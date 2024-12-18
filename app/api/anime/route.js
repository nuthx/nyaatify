import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

// Get anime list with pagination
// Method: GET

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const size = 25;
  const offset = (page - 1) * size;
  
  const db = await getDb();

  try {
    const [anime, total] = await Promise.all([
      db.all(`
        SELECT a.*, GROUP_CONCAT(r.name) as rss_names
        FROM anime a
        LEFT JOIN anime_rss ar ON a.guid = ar.anime_id
        LEFT JOIN rss r ON ar.rss_id = r.id
        GROUP BY a.guid
        ORDER BY a.date DESC 
        LIMIT ? OFFSET ?
      `, [size, offset]),
      db.get('SELECT COUNT(*) as count FROM anime')
    ]);

    return Response.json({
      code: 200,
      message: "success",
      data: anime,
      pagination: {
        total: total.count,
        size: size,
        current: page
      }
    });
  }
  
  catch (error) {
    log.error(`Failed to load anime list: ${error}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
