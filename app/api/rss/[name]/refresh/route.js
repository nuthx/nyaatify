import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { refreshRSS } from "@/lib/parse";

// Refresh a rss subscription
// Params: name, string, required

export async function POST(_, { params }) {
  try {
    const db = await getDb();
    const name = (await params).name;

    // Refresh RSS
    const rss = await db.get("SELECT * FROM rss WHERE name = ?", [name]);
    refreshRSS(rss.id, rss.name, rss.url, rss.type);

    logger.info(`RSS subscription refreshed manually, name: ${name}`, { model: "POST /api/rss/name/refresh" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/rss/name/refresh" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
