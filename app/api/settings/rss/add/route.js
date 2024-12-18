import { getDb } from "@/lib/db";
import { rssSchedule } from "@/lib/schedule";
import { log } from "@/lib/log";

// Add a new RSS subscription
// Method: POST
// Body: {
//   name: string,
//   url: string,
//   interval: number
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if name already exists
    const existingName = await db.get("SELECT name FROM rss WHERE name = ?", data.name);
    if (existingName) {
      return Response.json({
        code: 400,
        message: "name exists"
      }, { status: 400 });
    }

    // Check if url already exists
    const existingUrl = await db.get("SELECT url FROM rss WHERE url = ?", data.url);
    if (existingUrl) {
      return Response.json({
        code: 400,
        message: "url exists"
      }, { status: 400 });
    }

    // Insert to database
    await db.run("INSERT INTO rss (name, url, interval) VALUES (?, ?, ?)", [data.name, data.url, data.interval]);

    // Update RSS schedule
    await rssSchedule();

    log.info(`Add RSS subscription success, name: ${data.name}, url: ${data.url}, interval: ${data.interval} minutes`);
    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Add RSS subscription failed: ${error}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
