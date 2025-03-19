import { sendResponse } from "@/lib/http/response";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Test a downloader connection
// Body: {
//   name: string, required
//   type: string, required
//   url: string, required
//   username: string, required
//   password: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Get downloader cookie
    let cookieResult = null;
    if (data.type === "qBittorrent") {
      cookieResult = await getQbittorrentCookie(data.url, data.username, data.password);
    } else {
      throw new Error(`Unsupported downloader: ${data.type}`);
    }

    // Return if connection failed
    if (!cookieResult.success) {
      throw new Error(cookieResult.message);
    }

    // Get downloader version
    let versionResult = null;
    if (data.type === "qBittorrent") {
      versionResult = await getQbittorrentVersion(data.url, cookieResult.data);
    }

    // Return if connection failed
    if (!versionResult.success) {
      throw new Error(versionResult.message);
    }

    return sendResponse(request, {
      message: `Test downloader successfully, name: ${data.name}, version: ${versionResult.data}`,
      data: { version: versionResult.data }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
