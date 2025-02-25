import parser from "cron-parser";
import RSSParser from "rss-parser";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { tasks, startTask } from "@/lib/schedule";

// Get rss list with next refresh time

export async function GET() {
  try {
    const db = await getDb();
    const rss = await db.all("SELECT * FROM rss ORDER BY name ASC");

    // Return rss list with next refresh time
    return Response.json({
      code: 200,
      message: "success",
      data: {
        rss: rss.map(item => ({
          ...item,
          next: tasks.get(item.name)?.nextInvocation() || null
        }))
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/rss" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new rss subscription
// Body: {
//   values: {
//     name: string, required
//     url: string, required
//     cron: string, required
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if name is empty
    if (data.values.name.trim() === "") {
      throw new Error("Name is required");
    }

    // Check if name already exists
    const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.values.name.trim());
    if (existingName) {
      throw new Error(`RSS already exists, name: ${data.values.name}`);
    }

    // Identify RSS type
    // Extract the first 20 characters of the RSS address to identify the RSS type
    let rssType = null;
    const urlPrefix = data.values.url.toLowerCase().substring(0, 20);
    if (urlPrefix.includes("nyaa")) {
      rssType = "Nyaa";
    } else if (urlPrefix.includes("mikan")) {
      rssType = "Mikan";
    } else {
      throw new Error(`RSS address is not supported, url: ${data.values.url}`);
    }

    // Check cron validity
    // This will throw an error if the cron is invalid
    try {
      parser.parseExpression(data.values.cron);
    } catch (error) {
      throw new Error(`Cron is invalid, cron: ${data.values.cron}, error: ${error.message}`);
    }

    // Check RSS address validity
    const rssParser = new RSSParser();
    const rss = await rssParser.parseURL(data.values.url);
    if (!rss) {
      throw new Error(`RSS address is invalid, url: ${data.values.url}`);
    }

    // Insert to database
    await db.run(
      "INSERT INTO rss (name, url, cron, type, state, created_at, refresh_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        data.values.name.trim(),
        data.values.url.trim(),
        data.values.cron.trim(),
        rssType,
        "completed",
        new Date().toISOString(),
        0
      ]
    );

    // Log info here because startTask will log another message
    logger.info(`RSS subscription added successfully, name: ${data.values.name}, type: ${rssType}`, { model: "POST /api/rss" });

    // Start RSS task
    const { lastID } = await db.get("SELECT last_insert_rowid() as lastID");
    await startTask({
      id: lastID,
      name: data.values.name,
      url: data.values.url,
      cron: data.values.cron,
      type: rssType
    });

    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/rss" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
