import { sendResponse } from "@/lib/http/response";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Test a downloader connection
// Body: {
//   values: {
//     name: string, required
//     type: string, required
//     url: string, required
//     username: string, required
//     password: string, required
//   }
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Get downloader cookie
    let cookieResult = null;
    if (data.values.type === "qBittorrent") {
      cookieResult = await getQbittorrentCookie(data.values.url, data.values.username, data.values.password);
    } else {
      throw new Error(`Unsupported downloader: ${data.values.type}`);
    }

    // Return if connection failed
    if (!cookieResult.success) {
      throw new Error(cookieResult.message);
    }

    // Get downloader version
    let versionResult = null;
    if (data.values.type === "qBittorrent") {
      versionResult = await getQbittorrentVersion(data.values.url, cookieResult.data);
    }

    // Return if connection failed
    if (!versionResult.success) {
      throw new Error(versionResult.message);
    }

    return sendResponse(request, {
      message: `Test downloader successfully, name: ${data.values.name}, version: ${versionResult.data}`,
      data: { version: versionResult.data }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
