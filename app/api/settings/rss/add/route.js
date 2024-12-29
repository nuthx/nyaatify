import RSSParser from "rss-parser";
import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { startTask } from "@/lib/schedule";

// Add a new RSS subscription
// Method: POST
// Body: {
//   name: string,
//   url: string,
//   cron: string
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();
  const parser = new RSSParser();

  try {
    // Check if name already exists
    const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.name);
    if (existingName) {
      return Response.json({
        code: 400,
        message: "Name already exists"
      }, { status: 400 });
    }

    // Check RSS validity
    const rss = await parser.parseURL(data.url);
    if (!rss) {
      return Response.json({
        code: 400,
        message: "Invalid RSS"
      }, { status: 400 });
    }

    // Identify RSS type
    const url = data.url.toLowerCase();
    const urlPrefix = url.substring(0, 20);
    let rssType = "Unknown";
    if (urlPrefix.includes("nyaa")) {
      rssType = "Nyaa";
    } else if (urlPrefix.includes("mikan")) {
      rssType = "Mikan";
    }

    // Insert to database
    await db.run("INSERT INTO rss (name, url, cron, type, state) VALUES (?, ?, ?, ?, ?)", [data.name, data.url, data.cron, rssType, "completed"]);
    log.info(`RSS subscription added successfully, name: ${data.name}, url: ${data.url}, type: ${rssType}, cron: ${data.cron} minutes`);

    // Start RSS task
    const { lastID } = await db.get("SELECT last_insert_rowid() as lastID");
    await startTask({
      id: lastID,
      name: data.name,
      url: data.url,
      cron: data.cron,
      type: rssType
    });

    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Failed to add RSS subscription: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
