import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
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
          added_on: torrent.added_on,
          state: torrent.state,
          progress: torrent.progress,
          dlspeed: torrent.dlspeed,
          upspeed: torrent.upspeed,
          downloaded: torrent.downloaded,
          uploaded: torrent.uploaded,
          num_leechs: torrent.num_leechs,
          num_seeds: torrent.num_seeds,
          server: server.name
        });
      });
    }));

    console.log(allTorrents);

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
