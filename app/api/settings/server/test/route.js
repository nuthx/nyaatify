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
    if (sid.includes("Error")) {
      return Response.json({
        code: 400,
        message: sid
      }, { status: 400 });
    }

    const version = await getQbittorrentVersion(data.url, sid);
    if (version === "unknown") {
      return Response.json({
        code: 400,
        message: "Error: Failed to connect to server"
      }, { status: 400 });
    }

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
