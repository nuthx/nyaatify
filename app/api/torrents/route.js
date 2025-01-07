import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents, addQbittorrentTorrent, manageQbittorrentTorrent } from "@/lib/api/qbittorrent";

// Get torrent list
// Method: GET

// Manage torrent state
// Method: POST
// Body: {
//   action: string (required, type: add, pause, resume, delete)
//   server: string (required)
//   hash: string (required)
// }

export async function GET() {
  const db = await getDb();
  try {
    // Check server online status
    const servers = await db.all("SELECT url, cookie, name FROM server");
    const serverStatuses = await Promise.all(
      servers.map(async server => {
        const version = await getQbittorrentVersion(server.url, server.cookie);
        return {
          ...server,
          isOnline: version !== "unknown"
        };
      })
    );
    const onlineServers = serverStatuses.filter(server => server.isOnline);

    // Get torrents from online servers
    const allTorrents = [];
    await Promise.all(onlineServers.map(async server => {
      const torrents = await getQbittorrentTorrents(server.url, server.cookie);
      torrents.forEach(torrent => {
        allTorrents.push({
          name: torrent.name,
          state: torrent.state,
          progress: torrent.progress,
          eta: torrent.eta,
          dlspeed: formatBytes(torrent.dlspeed),
          upspeed: formatBytes(torrent.upspeed),
          completed: formatBytes(torrent.completed),
          size: formatBytes(torrent.size),
          server: server.name,
          hash: torrent.hash,
          added_on: torrent.added_on
        });
      });
    }));

    // Sort by added_on desc, name, server
    allTorrents.sort((a, b) => {
      if (a.added_on !== b.added_on) {
        return b.added_on - a.added_on;
      }
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.server.localeCompare(b.server);
    });

    return Response.json({ 
      torrents: allTorrents,
      servers: servers.length,
      online: onlineServers.length
    });
  }

  catch (error) {
    log.error(`Failed to load torrent list: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if server and hash are provided
    if (!data.server) {
      return Response.json({ error: "Server required" }, { status: 400 });
    }
    if (!data.hash) {
      return Response.json({ error: "Hash required" }, { status: 400 });
    }

    // Get server info
    const server = await db.get("SELECT url, cookie FROM server WHERE name = ?", data.server);
    if (!server) {
      return Response.json({ error: "Server not found" }, { status: 404 });
    }

    // Add a torrent
    if (data.action === "add") {
      const result = await addQbittorrentTorrent(server.url, server.cookie, data.hash);
      if (result !== "success") {
        return Response.json({ error: result }, { status: 500 });
      }
    }

    // Pause, Resume, Delete a torrent
    if (data.action === "pause" || data.action === "resume" || data.action === "delete") {
      const result = await manageQbittorrentTorrent(data.action, server.url, server.cookie, data.hash);
      if (result !== "success") {
        return Response.json({ error: result }, { status: 500 });
      }
    }

    return Response.json({});
  }
  
  catch (error) {
    log.error(`Failed to ${data.action} torrent: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
