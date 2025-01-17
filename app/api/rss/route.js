import parser from "cron-parser";
import RSSParser from "rss-parser";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseRSS } from "@/lib/parse";
import { tasks, startTask, stopTask } from "@/lib/schedule";

// Get rss list with next invocation time
// Method: GET

export async function GET() {
  try {
    const db = await getDb();
    const rss = await db.all("SELECT * FROM rss ORDER BY name ASC");

    // Return rss list with next invocation time
    return Response.json({
      rss: rss.map(item => ({
        ...item,
        next: tasks.get(item.name)?.nextInvocation() || null
      }))
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/rss" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Add, delete or refresh a rss subscription
// Method: POST
// Body: {
//   action: string, required, type: add, delete, refresh
//   data: {
//     name: string, required
//     url: string, required for add only
//     cron: string, required for add only
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    if (data.action === "add") {
      // Check if name already exists
      const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.data.name);
      if (existingName) {
        logger.error(`Failed to add ${data.data.name} due to it already exists`, { model: "POST /api/rss" });
        return Response.json({ error: `Failed to add ${data.data.name} due to it already exists` }, { status: 400 });
      }

      // Check RSS address validity
      const rssParser = new RSSParser();
      const rss = await rssParser.parseURL(data.data.url);
      if (!rss) {
        logger.error(`Failed to add ${data.data.name} due to the RSS address is invalid`, { model: "POST /api/rss" });
        return Response.json({ error: `Failed to add ${data.data.name} due to the RSS address is invalid` }, { status: 400 });
      }

      // Check cron validity
      // This will throw an error if the cron is invalid
      try {
        parser.parseExpression(data.data.cron);
      } catch (error) {
        logger.error(`Failed to add ${data.data.name} due to the cron is invalid`, { model: "POST /api/rss" });
        return Response.json({ error: `Failed to add ${data.data.name} due to the cron is invalid` }, { status: 400 });
      }

      // Identify RSS type
      // Extract the first 20 characters of the RSS address to identify the RSS type
      let rssType = null;
      const urlPrefix = data.data.url.toLowerCase().substring(0, 20);
      if (urlPrefix.includes("nyaa")) {
        rssType = "Nyaa";
      } else if (urlPrefix.includes("mikan")) {
        rssType = "Mikan";
      } else {
        logger.error(`Failed to add ${data.data.name} due to the RSS address is not supported`, { model: "POST /api/rss" });
        return Response.json({ error: `Failed to add ${data.data.name} due to the RSS address is not supported` }, { status: 400 });
      }

      // Insert to database
      await db.run(
        "INSERT INTO rss (name, url, cron, type, state, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [data.data.name, data.data.url, data.data.cron, rssType, "completed", new Date().toISOString()]
      );

      // Log info here because startTask will log another message
      logger.info(`${data.data.name} added successfully, url: ${data.data.url}, cron: ${data.data.cron}`, { model: "POST /api/rss" });

      // Start RSS task
      const { lastID } = await db.get("SELECT last_insert_rowid() as lastID");
      await startTask({
        id: lastID,
        name: data.data.name,
        url: data.data.url,
        cron: data.data.cron,
        type: rssType
      });

      return Response.json({});
    }

    else if (data.action === "delete") {
      // Check if RSS is running
      const rss = await db.get("SELECT * FROM rss WHERE name = ?", [data.data.name]);
      if (rss.state === "running") {
        logger.error(`Failed to delete ${data.data.name} due to it is running`, { model: "POST /api/rss" });
        return Response.json({ error: `Failed to delete ${data.data.name} due to it is running` }, { status: 400 });
      }

      // Stop RSS task
      await stopTask(data.data.name);

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

        logger.info(`${data.data.name} deleted successfully`, { model: "POST /api/rss" });
        return Response.json({});
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    }

    else if (data.action === "refresh") {
      const rss = await db.get("SELECT * FROM rss WHERE name = ?", [data.data.name]);
      parseRSS(rss.id, rss.name, rss.url, rss.type);
      logger.info(`Start refreshing ${data.data.name} manually by user`, { model: "POST /api/rss" });
      return Response.json({});
    }

    else {
      logger.error(`Invalid action for ${data.data.name}: ${data.action}`, { model: "POST /api/rss" });
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error(error.message, { model: "POST /api/rss" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
