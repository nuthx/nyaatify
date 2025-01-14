import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { formatBytes } from "@/lib/bytes";
import { getQbittorrentVersion, getQbittorrentTorrents } from "@/lib/api/qbittorrent";

// Get anime list with pagination
// Method: GET
// Params: page (number, optional, default: 1)
//         size (number, optional, default: 20)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const size = parseInt(searchParams.get("size") || "20");
  const offset = (page - 1) * size;
  const db = await getDb();

  try {
    let [anime, total, todayCount, weekCount, config, servers] = await Promise.all([
      db.all(`
        SELECT a.*, GROUP_CONCAT(r.name) as rss_names
        FROM anime a
        LEFT JOIN rss_anime ra ON a.hash = ra.anime_hash
        LEFT JOIN rss r ON ra.rss_id = r.id
        GROUP BY a.id
        ORDER BY a.pub_date DESC 
        LIMIT ? OFFSET ?
      `, [size, offset]),
      // Get total count
      db.get("SELECT COUNT(*) as count FROM anime"),
      // Get today's count
      db.get("SELECT COUNT(*) as count FROM anime WHERE date(pub_date) = date('now')"),
      // Get this week's count
      db.get("SELECT COUNT(*) as count FROM anime WHERE pub_date >= date('now', '-7 days')"),
      // Get default server config
      db.all("SELECT key, value FROM config").then(rows => 
        rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
      ),
      // Get all servers
      db.all("SELECT name, url, cookie FROM server")
    ]);

    // Check if default server is online
    let defaultOnline = 0;
    if (config.default_server) {
      const defaultServerInfo = servers.find(server => server.name === config.default_server);
      const version = await getQbittorrentVersion(defaultServerInfo.url, defaultServerInfo.cookie);
      defaultOnline = version === "unknown" ? 0 : 1;
    }

    // Get all torrents with server name
    const allTorrents = (await Promise.all(servers.map(async server => {
      const torrents = await getQbittorrentTorrents(server.url, server.cookie);
      return torrents.map(t => ({...t, server_name: server.name}));
    }))).flat();

    return Response.json({
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
      default_server: config.default_server,
      default_server_online: defaultOnline,
      show_server_state: config.show_server_state,
      title_priority: config.title_priority
    });
  }

  catch (error) {
    log.error(`Failed to load anime list: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
