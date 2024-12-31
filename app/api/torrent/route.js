import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentTorrents, manageQbittorrentTorrent } from "@/lib/api/qbittorrent";

// Get torrent list
// Method: GET

// Edit torrent state
// Method: POST
// Body: {
//   state: string  (add, pause, resume, delete)
//   server: string
//   urls: string   (for add only)
//   hash: string   (for pause, resume, delete only)
// }

export async function GET() {
  const db = await getDb();
  try {
    const servers = await db.all("SELECT url, cookie, name FROM server");
    const allTorrents = [];

    await Promise.all(servers.map(async server => {
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
      code: 200,
      message: "success", 
      data: allTorrents
    });
  }
  
  catch (error) {
    log.error(`Failed to load torrent list: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Get server info
    if (!data.server) {
      return Response.json({
        code: 400,
        message: "Server required"
      }, { status: 400 });
    }
    const server = await db.get("SELECT url, cookie FROM server WHERE name = ?", data.server);

    // Add
    // TODO: Implement add torrent

    // Pause, resume, delete
    if (data.state === "pause" || data.state === "resume" || data.state === "delete") {
      if (!data.hash) {
        return Response.json({
          code: 400,
          message: "Hash required"
        }, { status: 400 });
      }
      const result = await manageQbittorrentTorrent(data.state, server.url, server.cookie, data.hash);
      if (!result) {
        return Response.json({
          code: 500,
          message: `Failed to ${data.state} torrent`
        }, { status: 500 });
      }
    }

    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Failed to ${data.state} torrent: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
