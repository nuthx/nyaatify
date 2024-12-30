import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

const loginUrl = "/api/v2/auth/login";
const versionUrl = "/api/v2/app/version";

export async function getQbittorrentCookie(url, username, password) {
  try {
    const response = await fetch(`${url}${loginUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (!response.ok) {
      return "Error: Failed to connect to qBittorrent";
    }

    // Get cookie from response headers
    const cookies = response.headers.get("set-cookie");
    if (!cookies) {
      return "Error: Failed to login to qBittorrent, please check your username and password";
    }

    // Extract SID cookie
    const sidMatch = cookies.match(/SID=([^;]+)/);
    if (!sidMatch) {
      return "Error: Could not get a valid SID";
    }

    return sidMatch[1];
  }
  
  catch (error) {
    return "Error: Failed to connect to qBittorrent";
  }
}

export async function getQbittorrentVersion(url, cookie, retryCount = 0) {
  try {
    const response = await fetch(`${url}${versionUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    if (response.status === 403 && retryCount === 0) {
      // Get credentials from database
      const db = await getDb();
      const server = await db.get("SELECT username, password FROM server WHERE url = ?", url);

      // Get new cookie
      const newCookie = await getQbittorrentCookie(url, server.username, server.password);
      if (newCookie.includes("Error")) {
        log.error("Failed to get new cookie");
        return "unknown";
      }

      // Update cookie in database
      await db.run("UPDATE server SET cookie = ? WHERE url = ?", [newCookie, url]);
      
      // Retry to get version
      log.info("Updated qBittorrent cookie");
      return await getQbittorrentVersion(url, newCookie, retryCount + 1);
    }

    if (!response.ok) {
      log.error(`Failed to get qBittorrent version, ${response.statusText}`);
      return "unknown";
    }

    const version = await response.text();
    const versionNumber = version.replace(/v/g, "");
    return versionNumber;
  }
  
  catch (error) {
    return "unknown";
  }
}
