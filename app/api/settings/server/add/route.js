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

    // Get download server cookie
    let cookie = null;
    if (data.type === "qbittorrent") {
      cookie = await getQbittorrentCookie(data.url, data.username, data.password);
    }

    // Insert to database
    await db.run(
      "INSERT INTO server (name, url, type, username, password, cookie, cookie_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.name, data.url, data.type, data.username, data.password, cookie, new Date(Date.now() + 30 * 60 * 1000).toISOString()]  // Cookie expires in 30 minutes
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
