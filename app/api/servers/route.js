import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get server list with server version, online state and default server
// Method: GET

export async function GET() {
  try {
    const db = await getDb();
    const servers = await db.all("SELECT * FROM server ORDER BY name ASC");
    const config = await db.all("SELECT key, value FROM config").then(rows => 
      rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    );

    // Get all servers' version and online state
    const serversWithState = await Promise.all(servers.map(async server => {
      const version = await getQbittorrentVersion(server.url, server.cookie);
      const state = version === "unknown" ? "offline" : "online";
      return {
        ...server,
        version,
        state
      };
    }));

    return Response.json({
      code: 200,
      message: "success",
      data: {
        servers: serversWithState,
        default_server: config.default_server
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/servers" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Add, delete or test a download server 
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
        db.get("SELECT name FROM server WHERE name = ?", data.data.name),
        db.get("SELECT url FROM server WHERE url = ?", data.data.url)
      ]);
      if (existingName) {
        throw new Error(`Failed to add ${data.data.name} due to it already exists`);
      }
      if (existingUrl) {
        throw new Error(`Failed to add ${data.data.name} due to the URL already exists`);
      }

      // Get download server cookie
      // This will check if the connection is successful
      let result = null;
      if (data.data.type === "qBittorrent") {
        result = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      } else {
        throw new Error(`Failed to add ${data.data.name} due to the server is not supported`);
      }

      // Return if connection failed
      if (!result || result.includes("Error")) {
        throw new Error(`Failed to add ${data.data.name}`);
      }

      // Insert to database
      await db.run(
        "INSERT INTO server (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.data.name, data.data.url, data.data.type, data.data.username, data.data.password, new Date().toISOString(), result]
      );
      logger.info(`${data.data.name} added successfully, type: ${data.data.type}, url: ${data.data.url}`, { model: "POST /api/servers" });

      // Update default server only if empty
      // Get the current value to determine if update is needed
      const prevDefaultServer = await db.get("SELECT value FROM config WHERE key = 'default_server'");
      await db.run(`
        UPDATE config 
        SET value = CASE 
          WHEN value = "" THEN ? 
          ELSE value 
        END 
        WHERE key = "default_server"
      `, [data.data.name]);

      // Log if default server is empty before update
      if (prevDefaultServer.value === "") {
        logger.info(`Default server set to ${data.data.name}`, { model: "POST /api/servers" });
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
        // Delete server
        await db.run("DELETE FROM server WHERE name = ?", [data.data.name]);

        // Get default server of config
        const config = await db.all("SELECT key, value FROM config").then(rows => 
          rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
        );

        // Update default server
        // If deleted server is default server, update default server to the first server
        // If no server left, set default server to empty
        let nextServerName = null;
        if (data.data.name === config.default_server) {
          // Find next available server, excluding the one being deleted
          // If no server left, nextServerName will be null
          const nextServer = await db.get("SELECT name FROM server WHERE name != ? LIMIT 1", [data.data.name]);
          nextServerName = nextServer?.name || "";
          await db.run("UPDATE config SET value = ? WHERE key = 'default_server'", [nextServerName]);
        }

        // Commit transaction
        await db.run("COMMIT");

        logger.info(`${data.data.name} deleted successfully`, { model: "POST /api/servers" });
        if (nextServerName) {
          logger.info(`Default server changed from ${data.data.name} to ${nextServerName}`, { model: "POST /api/servers" });
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
      // Get download server cookie
      let result = null;
      if (data.data.type === "qBittorrent") {
        result = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      } else {
        throw new Error(`Failed to test ${data.data.name} due to the server is not supported`);
      }

      // Return if connection failed
      if (!result || result.includes("Error")) {
        throw new Error(`Failed to test ${data.data.name} due to connection failed`);
      }

      // Get download server version
      const version = await getQbittorrentVersion(data.data.url, result);
      if (version === "unknown") {
        throw new Error(`Failed to test ${data.data.name} due to connection failed`);
      }

      logger.info(`${data.data.name} connected successfully, version: ${version}`, { model: "POST /api/servers" });
      return Response.json({
        code: 200,
        message: "success",
        data: {
          version: version
        }
      });
    }

    else {
      throw new Error(`Invalid action: ${data.action}`);
    }
  } catch (error) {
    logger.error(error.message, { model: "POST /api/servers" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
