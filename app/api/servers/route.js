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

    // Log server list with each server's online state
    logger.info(
      `Fetched server list successfully, count: ${servers.length}, names: ${
        serversWithState.map(item => `${item.name}(${item.state})`).join(", ")
      }`, { model: "GET /api/servers" }
    );
    return Response.json({
      servers: serversWithState,
      default_server: config.default_server
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/servers" });
    return Response.json({ error: error.message }, { status: 500 });
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
        logger.error(`Failed to add ${data.data.name} due to it already exists`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to add ${data.data.name} due to it already exists` }, { status: 400 });
      }
      if (existingUrl) {
        logger.error(`Failed to add ${data.data.name} due to the URL already exists`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to add ${data.data.name} due to the URL already exists` }, { status: 400 });
      }

      // Get download server cookie
      // This will check if the connection is successful
      let result = null;
      if (data.data.type === "qBittorrent") {
        result = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      } else {
        logger.error(`Failed to add ${data.data.name} due to the server is not supported`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to add ${data.data.name} due to the server is not supported` }, { status: 400 });
      }

      // Return if connection failed
      if (!result || result.includes("Error")) {
        logger.error(`Failed to add ${data.data.name}`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to add ${data.data.name}` }, { status: 400 });
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

      return Response.json({});
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
        return Response.json({});
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
        logger.error(`Failed to test ${data.data.name} due to the server is not supported`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to test ${data.data.name} due to the server is not supported` }, { status: 400 });
      }

      // Return if connection failed
      if (!result || result.includes("Error")) {
        logger.error(`Failed to test ${data.data.name} due connection failed`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to test ${data.data.name} due to connection failed` }, { status: 400 });
      }

      // Get download server version
      const version = await getQbittorrentVersion(data.data.url, result);
      if (version === "unknown") {
        logger.error(`Failed to test ${data.data.name} due to connection failed`, { model: "POST /api/servers" });
        return Response.json({ error: `Failed to test ${data.data.name} due to connection failed` }, { status: 400 });
      }

      logger.info(`${data.data.name} connected successfully, version: ${version}`, { model: "POST /api/servers" });
      return Response.json({ version: version });
    }

    else {
      logger.error(`Invalid action for ${data.data.name}: ${data.action}`, { model: "POST /api/servers" });
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error(error.message, { model: "POST /api/servers" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
