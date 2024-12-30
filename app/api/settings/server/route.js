import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get server list
// Method: GET

export async function GET() {
  const db = await getDb();

  try {
    const servers = await db.all("SELECT * FROM server ORDER BY name ASC");
    
    return Response.json({
      code: 200,
      message: "success", 
      data: await Promise.all(servers.map(async server => {
        const version = await getQbittorrentVersion(server.url, server.cookie);
        return {
          ...server,
          version,
          state: version === "unknown" ? "offline" : "online"
        };
      }))
    });
  }
  catch (error) {
    log.error(`Failed to load server list: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
