import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

// Get anime list with pagination
// Method: GET
// Params: page (number, optional, default: 1)
//         size (number, optional, default: 25)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const size = parseInt(searchParams.get("size") || "25");
  const offset = (page - 1) * size;
  const db = await getDb();

  try {
    const [anime, total, todayCount, weekCount] = await Promise.all([
      db.all(`
        SELECT a.*, GROUP_CONCAT(r.name) as rss_names
        FROM anime a
        LEFT JOIN rss_anime ra ON a.hash = ra.anime_hash
        LEFT JOIN rss r ON ra.rss_id = r.id
        GROUP BY a.id
        ORDER BY a.pub_date DESC 
        LIMIT ? OFFSET ?
      `, [size, offset]),
      // Get total count
      db.get("SELECT COUNT(*) as count FROM anime"),
      // Get today's count
      db.get("SELECT COUNT(*) as count FROM anime WHERE date(pub_date) = date('now')"),
      // Get this week's count
      db.get("SELECT COUNT(*) as count FROM anime WHERE pub_date >= date('now', '-7 days')")
    ]);

    return Response.json({
      code: 200,
      message: "success",
      data: anime,
      count: {
        today: todayCount.count,
        week: weekCount.count,
        total: total.count
      },
      pagination: {
        total: total.count,
        size: size,
        current: page
      }
    });
  }
  
  catch (error) {
    log.error(`Failed to load anime list: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
