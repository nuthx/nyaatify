import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents, manageQbittorrentTorrent } from "@/lib/api/qbittorrent";

// Get torrent list
// Method: GET

export async function GET() {
  try {
    const db = await getDb();

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
  } catch (error) {
    logger.error(error.message, { model: "GET /api/torrents" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Manage torrent state
// Method: POST
// Body: {
//   action: string, required, type: download, pause, resume, delete
//   server: string, required
//   hash: string, required
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Get server info
    const server = await db.get("SELECT url, cookie FROM server WHERE name = ?", data.server);
    if (!server) {
      logger.error(`Failed to ${data.action} ${data.hash} due to ${data.server} server not found`, { model: "POST /api/torrents" });
      return Response.json({ error: `Failed to ${data.action} ${data.hash} due to ${data.server} server not found` }, { status: 404 });
    }

    // Manage the torrent
    const result = await manageQbittorrentTorrent(data.action, server.url, server.cookie, data.hash);
    if (result !== "success") {
      logger.error(`Failed to ${data.action} ${data.hash} due to connection failed`, { model: "POST /api/torrents" });
      return Response.json({ error: `Failed to ${data.action} ${data.hash} due to connection failed` }, { status: 500 });
    }

    logger.info(`${data.action} ${data.hash} successfully`, { model: "POST /api/torrents" });
    return Response.json({});
  } catch (error) {
    logger.error(error.message, { model: "POST /api/torrents" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
