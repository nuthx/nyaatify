import parser from "cron-parser";
import RSSParser from "rss-parser";
import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { parseRSS } from "@/lib/parse";
import { tasks, startTask, stopTask } from "@/lib/schedule";

// Get rss list
// Method: GET

// Add, delete or refresh a rss subscription
// Method: POST
// Body: {
//   action: string (required, type: add, delete, refresh)
//   data: object (required)
// }
// --------------------------------
// Object of add:
//   name: string (required)
//   url: string (required)
//   cron: string (required)
// --------------------------------
// Object of refresh/delete:
//   name: string (required)

export async function GET() {
  try {
    const db = await getDb();
    const rss = await db.all("SELECT * FROM rss ORDER BY name ASC");

    return Response.json({
      rss: rss.map(item => ({
        ...item,
        next: tasks.get(item.name)?.nextInvocation() || null
      }))
    });
  }
  
  catch (error) {
    log.error(`Failed to load rss list: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    if (data.action === "add") {
      const rssParser = new RSSParser();

      // Check if name already exists
      const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.data.name);
      if (existingName) {
        return Response.json({ error: `${data.data.name} already exists` }, { status: 400 });
      }

      // Check RSS validity
      const rss = await rssParser.parseURL(data.data.url);
      if (!rss) {
        return Response.json({ error: "Invalid RSS Subscription" }, { status: 400 });
      }

      // Check cron validity
      // If not valid, error message will return in the catch block
      parser.parseExpression(data.data.cron);

      // Identify RSS type
      const url = data.data.url.toLowerCase();
      const urlPrefix = url.substring(0, 20);
      let rssType = "Unknown";
      if (urlPrefix.includes("nyaa")) {
        rssType = "Nyaa";
      } else if (urlPrefix.includes("mikan")) {
        rssType = "Mikan";
      }

      // Insert to database
      await db.run(
        "INSERT INTO rss (name, url, cron, type, state, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [data.data.name, data.data.url, data.data.cron, rssType, "completed", new Date().toISOString()]
      );
      log.info(`RSS subscription added successfully, name: ${data.data.name}, url: ${data.data.url}, type: ${rssType}, cron: ${data.data.cron}`);

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
        return Response.json({ error: `${data.data.name} is running` }, { status: 400 });
      }

      // Stop RSS task
      await stopTask(data.data.name);

      // Start transaction
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

        // Commit transaction
        await db.run("COMMIT");

        log.info(`RSS subscription deleted successfully, name: ${data.data.name}`);
        return Response.json({});
      } catch (error) {
        await db.run("ROLLBACK");
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    else if (data.action === "refresh") {
      const rss = await db.get("SELECT * FROM rss WHERE name = ?", [data.data.name]);
      parseRSS(rss.id, rss.name, rss.url, rss.type);
      return Response.json({});
    }

    else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  }

  catch (error) {
    log.error(`Failed to ${data.action} ${data.type}: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
