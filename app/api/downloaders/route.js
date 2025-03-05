import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get downloader list with downloader version and online state

export async function GET() {
  try {
    const db = await getDb();
    const downloaders = await db.all("SELECT * FROM downloader ORDER BY name ASC");

    // Get all downloaders' version and online state
    const downloadersWithState = await Promise.all(downloaders.map(async downloader => {
      const version = await getQbittorrentVersion(downloader.url, downloader.cookie);
      const state = version.success ? "online" : "offline";
      return {
        ...downloader,
        version: version.data,
        state
      };
    }));

    logger.debug("Get downloader list successfully", { model: "GET /api/downloaders" });
    return Response.json({
      code: 200,
      message: "success",
      data: {
        downloaders: downloadersWithState
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/downloaders" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new downloader
// Body: {
//   values: {
//     name: string, required
//     type: string, required
//     url: string, required
//     username: string, required
//     password: string, required
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if name is empty
    if (data.values.name.trim() === "") {
      throw new Error("Downloader name is required");
    }

    // Check if name or URL already exists
    const [existingName, existingUrl] = await Promise.all([
      db.get("SELECT name FROM downloader WHERE name = ?", data.values.name.trim()),
      db.get("SELECT url FROM downloader WHERE url = ?", data.values.url.trim())
    ]);
    if (existingName) {
      throw new Error(`Downloader already exists, name: ${data.values.name}`);
    }
    if (existingUrl) {
      throw new Error(`Downloader already exists, url: ${data.values.url}`);
    }

    // Get downloader cookie
    // This will check if the connection is successful
    let cookieResult = null;
    if (data.values.type === "qBittorrent") {
      cookieResult = await getQbittorrentCookie(data.values.url, data.values.username, data.values.password);
    } else {
      throw new Error(`Unsupported downloader: ${data.values.type}`);
    }

    // Return if connection failed
    if (!cookieResult.success) {
      throw new Error(cookieResult.message);
    }

    // Insert to database
    await db.run(
      "INSERT INTO downloader (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        data.values.name.trim(),
        data.values.url.trim(),
        data.values.type,
        data.values.username,
        data.values.password,
        new Date().toISOString(),
        cookieResult.data
      ]
    );

    // Update default downloader only if empty
    // Get the current value to determine if update is needed
    const prevDefaultDownloader = await db.get("SELECT value FROM config WHERE key = 'default_downloader'");
    await db.run(`
      UPDATE config 
      SET value = CASE 
        WHEN value = "" THEN ? 
        ELSE value 
      END 
      WHERE key = "default_downloader"
    `, [data.values.name]);

    // Log if default downloader is empty before update
    if (prevDefaultDownloader.value === "") {
      logger.info(`Set default downloader to ${data.values.name}`, { model: "POST /api/downloaders" });
    }

    logger.info(`Add downloader successfully, name: ${data.values.name}, type: ${data.values.type}`, { model: "POST /api/downloaders" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/downloaders" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
