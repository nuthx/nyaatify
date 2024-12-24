import { log } from "@/lib/log";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Test a download server
// Method: POST
// Body: {
//   type: string,
//   name: string,
//   url: string,
//   username: string,
//   password: string
// }

export async function POST(request) {
  const data = await request.json();

  try {
    const sid = await getQbittorrentCookie(data.url, data.username, data.password);
    const version = await getQbittorrentVersion(data.url, sid);

    log.info(`Download server test successful, version: ${version}`);
    return Response.json({
      code: 200,
      message: "success",
      data: version
    });
  }
  
  catch (error) {
    log.error(`Failed to test download server: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
