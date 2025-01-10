import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get server list
// Method: GET

// Add, delete or test a download server 
// Method: POST
// Body: {
//   action: string (required, type: add, delete, test)
//   data: object (required)
// }
// --------------------------------
// Object of add/test:
//   type: string (required, type: qBittorrent, Transmission, Aria2)
//   name: string (required)
//   url: string (required)
//   username: string (required)
//   password: string (required)
// --------------------------------
// Object of delete:
//   name: string (required)

export async function GET() {
  try {
    const db = await getDb();
    const servers = await db.all("SELECT * FROM server ORDER BY name ASC");
    const config = await db.all("SELECT key, value FROM config").then(rows => 
      rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    );

    return Response.json({
      servers: await Promise.all(servers.map(async server => {
        const version = await getQbittorrentVersion(server.url, server.cookie);
        return {
          ...server,
          version,
          state: version === "unknown" ? "offline" : "online"
        };
      })),
      default_server: config.default_server
    });
  }
  
  catch (error) {
    log.error(`Failed to load ${type} list: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

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
        return Response.json({ error: `${data.data.name} already exists` }, { status: 400 });
      }
      if (existingUrl) {
        return Response.json({ error: "URL already exists" }, { status: 400 });
      }

      // Get download server cookie
      let cookieResult = null;
      if (data.data.type === "qBittorrent") {
        cookieResult = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      }

      // Return if connection failed
      if (cookieResult === null || (typeof cookieResult === 'string' && cookieResult.includes("Error"))) {
        return Response.json({ error: cookieResult || "Failed to connect to server" }, { status: 400 });
      }

      // Insert to database
      await db.run(
        "INSERT INTO server (name, url, type, username, password, created_at, cookie) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data.data.name, data.data.url, data.data.type, data.data.username, data.data.password, new Date().toISOString(), cookieResult]
      );

      // Update default server only if empty
      await db.run(`
        UPDATE config 
        SET value = CASE 
          WHEN value = '' THEN ? 
          ELSE value 
        END 
        WHERE key = 'default_server'
      `, [data.data.name]);

      log.info(`Download server added successfully, name: ${data.data.name}, url: ${data.data.url}`);
      return Response.json({});
    }

    else if (data.action === "delete") {
      // Start transaction
      await db.run("BEGIN TRANSACTION");

      try {
        // Delete server
        await db.run("DELETE FROM server WHERE name = ?", [data.data.name]);

        // Update default server
        // If deleted server is default server, update default server to the first server
        // If no server left, set default server to empty
        const config = await db.all("SELECT key, value FROM config").then(rows => 
          rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
        );
        if (data.data.name === config.default_server) {
          await db.run(`
            UPDATE config 
            SET value = CASE 
              WHEN (SELECT COUNT(*) FROM server) = 0 THEN ''
              ELSE (SELECT name FROM server LIMIT 1)
            END 
            WHERE key = 'default_server'
          `);
        }

        // Commit transaction
        await db.run("COMMIT");

        log.info(`Download server deleted successfully, name: ${data.data.name}`);
        return Response.json({});
      } catch (error) {
        await db.run("ROLLBACK");
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    else if (data.action === "test") {
      // Get download server cookie
      let cookieResult = null;
      if (data.data.type === "qBittorrent") {
        cookieResult = await getQbittorrentCookie(data.data.url, data.data.username, data.data.password);
      }

      // Return if connection failed
      if (cookieResult === null || (typeof cookieResult === 'string' && cookieResult.includes("Error"))) {
        return Response.json({ error: cookieResult || "Failed to connect to server" }, { status: 400 });
      }

      // Get download server version
      const version = await getQbittorrentVersion(data.data.url, cookieResult);
      if (version === "unknown") {
        return Response.json({ error: "Failed to connect to server" }, { status: 400 });
      }

      log.info(`Download server test successful, version: ${version}`);
      return Response.json({ version: version });
    }

    else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  }

  catch (error) {
    log.error(`Failed to ${data.action} ${data.type}: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
