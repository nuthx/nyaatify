import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents } from "@/lib/api/qbittorrent";

// Get anime list with pagination
// Method: GET
// Params: page, number, optional, default: 1
//         size, number, optional, default: 20

export async function GET(request) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const size = parseInt(request.nextUrl.searchParams.get("size") || "20");
    const offset = (page - 1) * size;
    const db = await getDb();

    let [anime, total, todayCount, weekCount, servers, config] = await Promise.all([
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
      db.all("SELECT name, url, cookie FROM server"),
      db.all("SELECT key, value FROM config").then(rows => 
        rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
      )
    ]);

    // Check if default server is online
    let defaultOnline = "0";
    if (config.default_server) {
      const defaultServerInfo = servers.find(server => server.name === config.default_server);
      const version = await getQbittorrentVersion(defaultServerInfo.url, defaultServerInfo.cookie);
      defaultOnline = version === "unknown" ? "0" : "1";
    }

    // Get all torrents to match anime download status
    const allTorrents = (await Promise.all(servers.map(async server => {
      const torrents = await getQbittorrentTorrents(server.url, server.cookie);
      return torrents.map(t => ({...t, server_name: server.name}));
    }))).flat();

    return Response.json({
      code: 200,
      message: "success",
      data: {
        anime: anime.map(item => {
          const matchingTorrent = allTorrents.find(t => t.hash.toLowerCase() === item.hash.toLowerCase());
          return {
            ...item,
            server: matchingTorrent ? {
              name: matchingTorrent.server_name,
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
          default_server: config.default_server,
          default_server_online: defaultOnline,
          show_server_state: config.show_server_state,
          title_priority: config.title_priority,
          cover_source: config.cover_source
        }
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/anime" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
