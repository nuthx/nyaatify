import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents, manageQbittorrentTorrent } from "@/lib/api/qbittorrent";

// Get torrent list
// Method: GET

export async function GET() {
  try {
    const db = await getDb();

    // Check downloader online status
    const downloaders = await db.all("SELECT url, cookie, name FROM downloader");
    const downloaderStatuses = await Promise.all(
      downloaders.map(async downloader => {
        const version = await getQbittorrentVersion(downloader.url, downloader.cookie);
        return {
          ...downloader,
          isOnline: version.success
        };
      })
    );
    const onlineDownloaders = downloaderStatuses.filter(downloader => downloader.isOnline);

    // Get torrents from online downloaders
    const allTorrents = [];
    await Promise.all(onlineDownloaders.map(async downloader => {
      const torrentsResult = await getQbittorrentTorrents(downloader.url, downloader.cookie);
      torrentsResult.data.forEach(torrent => {
        allTorrents.push({
          name: torrent.name,
          state: torrent.state,
          progress: torrent.progress,
          eta: torrent.eta,
          dlspeed: formatBytes(torrent.dlspeed),
          upspeed: formatBytes(torrent.upspeed),
          completed: formatBytes(torrent.completed),
          size: formatBytes(torrent.size),
          downloader: downloader.name,
          hash: torrent.hash,
          added_on: torrent.added_on
        });
      });
    }));

    // Sort by added_on desc, name, downloader
    allTorrents.sort((a, b) => {
      if (a.added_on !== b.added_on) {
        return b.added_on - a.added_on;
      }
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.downloader.localeCompare(b.downloader);
    });

    return Response.json({
      code: 200,
      message: "success",
      data: {
        torrents: allTorrents,
        downloaders: downloaders.length,
        online: onlineDownloaders.length
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/torrents" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Manage torrent state
// Method: POST
// Body: {
//   action: string, required, type: download, pause, resume, delete
//   downloader: string, required
//   hash: string, required
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Get downloader info
    const downloader = await db.get("SELECT url, cookie FROM downloader WHERE name = ?", data.downloader);
    if (!downloader) {
      throw new Error(`Failed to ${data.action} ${data.hash} due to ${data.downloader} downloader not found`);
    }

    // Manage the torrent
    const manageResult = await manageQbittorrentTorrent(data.action, downloader.url, downloader.cookie, data.hash);
    if (!manageResult.success) {
      throw new Error(manageResult.message);
    }

    logger.info(`${data.action} ${data.hash} successfully`, { model: "POST /api/torrents" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/torrents" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
