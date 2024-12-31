import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentTorrents } from "@/lib/api/qbittorrent";

// Get torrent list
// Method: GET

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
          server: server.name
        });
      });
    }));

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
