import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { getQbittorrentCookie } from "@/lib/api/qbittorrent";

// Add a new download server
// Method: POST
// Body: {
//   type: string,
//   name: string,
//   url: string,
//   username: string,
//   password: string
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if name already exists
    const existingName = await db.get("SELECT name FROM server WHERE name = ?", data.name);
    if (existingName) {
      return Response.json({
        code: 400,
        message: "Name already exists"
      }, { status: 400 });
    }

    // Check if URL already exists
    const existingUrl = await db.get("SELECT url FROM server WHERE url = ?", data.url);
    if (existingUrl) {
      return Response.json({
        code: 400,
        message: "URL already exists"
      }, { status: 400 });
    }

    // Get download server cookie
    let cookie = null;
    if (data.type === "qBittorrent") {
      cookie = await getQbittorrentCookie(data.url, data.username, data.password);
    }

    // Return if connection failed
    if (cookie.includes("Error")) {
      return Response.json({
        code: 400,
        message: cookie
      }, { status: 400 });
    }

    // Insert to database
    await db.run(
      "INSERT INTO server (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.name, data.url, data.type, data.username, data.password, new Date().toISOString(), cookie]
    );

    log.info(`Download server added successfully, name: ${data.name}, url: ${data.url}`);
    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Failed to add download server: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
