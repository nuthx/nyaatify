import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents } from "@/lib/api/qbittorrent";

// Get anime list with pagination
// Params: page, number, optional, default: 1
//         size, number, optional, default: 20

export async function GET(request) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const size = parseInt(request.nextUrl.searchParams.get("size") || "20");
    const offset = (page - 1) * size;
    const db = await getDb();

    let [anime, total, todayCount, weekCount, downloaders, config] = await Promise.all([
      db.all(`
        SELECT a.*, GROUP_CONCAT(r.name) as rss_names
        FROM anime a
        LEFT JOIN rss_anime ra ON a.hash = ra.anime_hash
        LEFT JOIN rss r ON ra.rss_id = r.id
        GROUP BY a.id
        ORDER BY a.pub_date DESC 
        LIMIT ? OFFSET ?
      `, [size, offset]),
      db.get("SELECT COUNT(*) as count FROM anime"),
      db.get("SELECT COUNT(*) as count FROM anime WHERE date(pub_date) = date('now')"),
      db.get("SELECT COUNT(*) as count FROM anime WHERE pub_date >= date('now', '-7 days')"),
      db.all("SELECT name, url, cookie FROM downloader"),
      db.all("SELECT key, value FROM config").then(rows => 
        rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
      )
    ]);

    // Check if default downloader is online
    let defaultOnline = "0";
    if (config.default_downloader) {
      const defaultDownloaderInfo = downloaders.find(downloader => downloader.name === config.default_downloader);
      const version = await getQbittorrentVersion(defaultDownloaderInfo.url, defaultDownloaderInfo.cookie);
      defaultOnline = version.success ? "1" : "0";
    }

    // Get all torrents to match anime download status
    const allTorrents = (await Promise.all(downloaders.map(async downloader => {
      const torrentsResult = await getQbittorrentTorrents(downloader.url, downloader.cookie);
      return torrentsResult.data.map(t => ({...t, downloader_name: downloader.name}));
    }))).flat();

    return Response.json({
      code: 200,
      message: "success",
      data: {
        anime: anime.map(item => {
          const matchingTorrent = allTorrents.find(t => t.hash.toLowerCase() === item.hash.toLowerCase());
          return {
            ...item,
            downloader: matchingTorrent ? {
              name: matchingTorrent.downloader_name,
              state: matchingTorrent.state,
              progress: matchingTorrent.progress,
              completed: formatBytes(matchingTorrent.completed), 
              size: formatBytes(matchingTorrent.size)
            } : null
          };
        }),
        count: {
          today: todayCount.count,
          week: weekCount.count,
          total: total.count
        },
        pagination: {
          total: total.count,
          size: size,
          current: page
        },
        config: {
          default_downloader: config.default_downloader,
          default_downloader_online: defaultOnline,
          show_downloader_state: config.show_downloader_state,
          title_priority: config.title_priority,
          cover_source: config.cover_source
        }
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/anime" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
