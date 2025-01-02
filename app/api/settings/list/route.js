import parser from "cron-parser";
import RSSParser from "rss-parser";
import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { tasks, startTask, stopTask } from "@/lib/schedule";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get rss, server or notification list in settings page
// Method: GET
// Params: type (string, required, type: rss, server, notification)

// Add or delete a rss, server or notification item in settings page
// Method: POST
// Body: {
//   type: string (required, type: rss, server, notification)
//   action: string (required, type: add, delete, test)
//   data: object (required)
// }
// --------------------------------
// Object of add (rss):
//   name: string (required)
//   url: string (required)
//   cron: string (required)
// --------------------------------
// Object of add/test (server):
//   type: string (required, type: qBittorrent, Transmission, Aria2)
//   name: string (required)
//   url: string (required)
//   username: string (required)
//   password: string (required)
// --------------------------------
// Object of delete:
//   name: string (required)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const db = await getDb();

  try {
    if (type === "rss") {
      const rss = await db.all("SELECT * FROM rss ORDER BY name ASC");
      return Response.json({
        code: 200,
        message: "success",
        data: rss.map(item => ({
          ...item,
          next: tasks.get(item.name)?.nextInvocation() || null
        }))
      });
    }

    else if (type === "server") {
      const servers = await db.all("SELECT * FROM server ORDER BY name ASC");
      return Response.json({
        code: 200,
        message: "success", 
        data: await Promise.all(servers.map(async server => {
          const version = await getQbittorrentVersion(server.url, server.cookie);
          return {
            ...server,
            version,
            state: version === "unknown" ? "offline" : "online"
          };
        }))
      });
    }

    else {
      return Response.json({
        code: 400,
        message: "Invalid type"
      }, { status: 400 });
    }
  }

  catch (error) {
    log.error(`Failed to load ${type} list: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  const data = await request.json();
  const db = await getDb();

  console.log(data);

  try {
    if (data.action === "add" && data.type === "rss") {
      const rssParser = new RSSParser();

      // Check if name already exists
      const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.data.name);
      if (existingName) {
        return Response.json({
          code: 400,
          message: `Name ${data.data.name} already exists`
        }, { status: 400 });
      }

      // Check RSS validity
      const rss = await rssParser.parseURL(data.data.url);
      if (!rss) {
        return Response.json({
          code: 400,
          message: "Invalid RSS URL"
        }, { status: 400 });
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

      return Response.json({
        code: 200,
        message: "success"
      });
    }

    else if (data.action === "add" && data.type === "server") {
      // Check if name already exists
      const existingName = await db.get("SELECT name FROM server WHERE name = ?", data.data.name);
      if (existingName) {
        return Response.json({
          code: 400,
          message: "Name already exists"
        }, { status: 400 });
      }

      // Check if URL already exists
      const existingUrl = await db.get("SELECT url FROM server WHERE url = ?", data.data.url);
      if (existingUrl) {
        return Response.json({
          code: 400,
          message: "URL already exists"
        }, { status: 400 });
      }

      // Get download server cookie
      let cookie = null;
      if (data.data.type === "qBittorrent") {
        cookie = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      }

      // Return if connection failed
      if (cookie === null || (typeof cookie === 'string' && cookie.includes("Error"))) {
        return Response.json({
          code: 400,
          message: cookie || "Failed to connect to server"
        }, { status: 400 });
      }

      // Insert to database
      await db.run(
        "INSERT INTO server (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.data.name, data.data.url, data.data.type, data.data.username, data.data.password, new Date().toISOString(), cookie]
      );

      log.info(`Download server added successfully, name: ${data.data.name}, url: ${data.data.url}`);
      return Response.json({
        code: 200,
        message: "success"
      });
    }

    else if (data.action === "delete" && data.type === "rss") {
      // Check if RSS is running
      const rss = await db.get("SELECT * FROM rss WHERE name = ?", [data.data.name]);
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
      `, [rss.id, rss.id]);

      // Delete anime from rss_anime table
      await db.run("DELETE FROM rss_anime WHERE rss_id = ?", [rss.id]);

      // Delete anime from anime table
      if (animesToDelete.length > 0) {
        const animeHashes = animesToDelete.map(a => `'${a.anime_hash}'`).join(",");
        await db.run(`DELETE FROM anime WHERE hash IN (${animeHashes})`);
      }

      // Delete RSS from RSS table
      await db.run("DELETE FROM rss WHERE id = ?", [rss.id]);

      // Commit transaction
      await db.run("COMMIT");
      log.info(`RSS subscription deleted successfully, name: ${data.data.name}`);

      // Stop RSS task
      stopTask(data.data.name);

      return Response.json({
        code: 200,
        message: "success"
      });
    }

    else if (data.action === "delete" && data.type === "server") {
      await db.run("DELETE FROM server WHERE name = ?", [data.data.name]);

      log.info(`Download server deleted successfully, name: ${data.data.name}`);
      return Response.json({
        code: 200,
        message: "success"
      });
    }

    else if (data.action === "test" && data.type === "server") {
      let cookie = null;
      if (data.data.type === "qBittorrent") {
        cookie = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      }

      // Return if connection failed
      if (cookie === null || (typeof cookie === 'string' && cookie.includes("Error"))) {
        return Response.json({
          code: 400,
          message: cookie || "Failed to connect to server"
        }, { status: 400 });
      }

      const version = await getQbittorrentVersion(data.data.url, cookie);
      if (version === "unknown") {
        return Response.json({
          code: 400,
          message: "Error: Failed to connect to server"
        }, { status: 400 });
      }

      log.info(`Download server test successful, version: ${version}`);
      return Response.json({
        code: 200,
        message: "success",
        data: version
      });
    }

    else {
      return Response.json({
        code: 400,
        message: "Invalid type or action"
      }, { status: 400 });
    }
  }
  
  catch (error) {
    // Rollback transaction if rss delete action failed
    if (data.action === "delete" && data.type === "rss") {
      await db.run("ROLLBACK");
    }

    log.error(`Failed to ${data.action} a ${data.type}: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
