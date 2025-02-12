import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get downloader list with downloader version, online state and default downloader
// Method: GET

export async function GET() {
  try {
    const db = await getDb();
    const downloaders = await db.all("SELECT * FROM downloader ORDER BY name ASC");
    const config = await db.all("SELECT key, value FROM config").then(rows => 
      rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    );

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

    return Response.json({
      code: 200,
      message: "success",
      data: {
        downloaders: downloadersWithState,
        default_downloader: config.default_downloader
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/downloader" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Add, delete or test a downloader 
// Method: POST
// Body: {
//   action: string, required, type: add, delete, test
//   data: {
//     type: string, required for add/test only, type: qBittorrent, Transmission, Aria2
//     name: string, required
//     url: string, required for add/test only
//     username: string, required for add/test only
//     password: string, required for add/test only
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    if (data.action === "add") {
      // Check if name or URL already exists
      const [existingName, existingUrl] = await Promise.all([
        db.get("SELECT name FROM downloader WHERE name = ?", data.data.name.trim()),
        db.get("SELECT url FROM downloader WHERE url = ?", data.data.url.trim())
      ]);
      if (existingName) {
        throw new Error(`Failed to add ${data.data.name} due to it already exists`);
      }
      if (existingUrl) {
        throw new Error(`Failed to add ${data.data.name} due to the URL already exists`);
      }

      // Get downloader cookie
      // This will check if the connection is successful
      let cookieResult = null;
      if (data.data.type === "qBittorrent") {
        cookieResult = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      } else {
        throw new Error(`Failed to add ${data.data.name} due to the downloader is not supported`);
      }

      // Return if connection failed
      if (!cookieResult.success) {
        throw new Error(`Failed to add ${data.data.name}, error: ${cookieResult.message}`);
      }

      // Insert to database
      await db.run(
        "INSERT INTO downloader (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          data.data.name.trim(),
          data.data.url.trim(),
          data.data.type,
          data.data.username,
          data.data.password,
          new Date().toISOString(),
          cookieResult.data
        ]
      );
      logger.info(`${data.data.name} added successfully, type: ${data.data.type}, url: ${data.data.url}`, { model: "POST /api/downloader" });

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
      `, [data.data.name]);

      // Log if default downloader is empty before update
      if (prevDefaultDownloader.value === "") {
        logger.info(`Default downloader set to ${data.data.name}`, { model: "POST /api/downloader" });
      }

      return Response.json({
        code: 200,
        message: "success",
        data: null
      });
    }

    else if (data.action === "delete") {
      // Start transaction
      await db.run("BEGIN TRANSACTION");

      // Use try-catch because we need to monitor the transaction result
      try {
        // Delete downloader
        await db.run("DELETE FROM downloader WHERE name = ?", [data.data.name]);

        // Get default downloader of config
        const config = await db.all("SELECT key, value FROM config").then(rows => 
          rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
        );

        // Update default downloader
        // If deleted downloader is default downloader, update default downloader to the first downloader
        // If no downloader left, set default downloader to empty
        let nextDownloaderName = null;
        if (data.data.name === config.default_downloader) {
          // Find next available downloader, excluding the one being deleted
          // If no downloader left, nextDownloaderName will be null
          const nextDownloader = await db.get("SELECT name FROM downloader WHERE name != ? LIMIT 1", [data.data.name]);
          nextDownloaderName = nextDownloader?.name || "";
          await db.run("UPDATE config SET value = ? WHERE key = 'default_downloader'", [nextDownloaderName]);
        }

        // Commit transaction
        await db.run("COMMIT");

        logger.info(`${data.data.name} deleted successfully`, { model: "POST /api/downloader" });
        if (nextDownloaderName) {
          logger.info(`Default downloader changed from ${data.data.name} to ${nextDownloaderName}`, { model: "POST /api/downloader" });
        }
        return Response.json({
          code: 200,
          message: "success",
          data: null
        });
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    }

    else if (data.action === "test") {
      // Get downloader cookie
      let cookieResult = null;
      if (data.data.type === "qBittorrent") {
        cookieResult = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      } else {
        throw new Error(`Failed to test ${data.data.name} due to the downloader is not supported`);
      }

      // Return if connection failed
      if (!cookieResult.success) {
        throw new Error(`Failed to test ${data.data.name}, error: ${cookieResult.message}`);
      }

      // Get downloader version
      let versionResult = null;
      if (data.data.type === "qBittorrent") {
        versionResult = await getQbittorrentVersion(data.data.url, cookieResult.data);
      }

      // Return if connection failed
      if (!versionResult.success) {
        throw new Error(`Failed to test ${data.data.name}, error: ${versionResult.message}`);
      }

      logger.info(`${data.data.name} connected successfully, version: ${versionResult.data}`, { model: "POST /api/downloader" });
      return Response.json({
        code: 200,
        message: "success",
        data: {
          version: versionResult.data
        }
      });
    }

    else {
      throw new Error(`Invalid action: ${data.action}`);
    }
  } catch (error) {
    logger.error(error.message, { model: "POST /api/downloader" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
