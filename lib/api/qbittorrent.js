import { getDb } from "@/lib/db";
import { magnet } from "@/lib/magnet";
import { logger } from "@/lib/logger";

const loginUrl = "/api/v2/auth/login";
const versionUrl = "/api/v2/app/version";
const torrentsUrl = "/api/v2/torrents/info";
const addUrl = "/api/v2/torrents/add";
const pauseUrlV4 = "/api/v2/torrents/pause";
const pauseUrlV5 = "/api/v2/torrents/stop";
const resumeUrlV4 = "/api/v2/torrents/resume";
const resumeUrlV5 = "/api/v2/torrents/start";
const deleteUrl = "/api/v2/torrents/delete";

export async function getQbittorrentCookie(url, username, password) {
  try {
    const response = await fetch(`${url}${loginUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    // Get cookie from response headers
    const cookies = response.headers.get("set-cookie");
    if (!cookies) {
      throw new Error("Connected to the server, but the username or password is incorrect");
    }

    // Extract SID from cookie
    const sidMatch = cookies.match(/SID=([^;]+)/);
    if (!sidMatch) {
      throw new Error(`Login successfully, but unable to retrieve a valid SID, cookie: ${cookies}`);
    }

    logger.debug(`Get qBittorrent cookie successfully, url: ${url}`, { model: "getQbittorrentCookie" });
    return {
      success: true,
      message: "success",
      data: sidMatch[1]
    };
  } catch (error) {
    logger.error(`${error.message}, url: ${url}`, { model: "getQbittorrentCookie" });
    return {
      success: false,
      message: error.message
    };
  }
}

async function refreshQbittorrentCookie(url, originalRequest) {
  try {
    const db = await getDb();
    const downloader = await db.get("SELECT username, password FROM downloader WHERE url = ?", url);

    // Get new cookie
    const newCookie = await getQbittorrentCookie(url, downloader.username, downloader.password);
    if (!newCookie.success) {
      throw new Error(newCookie.message);
    }

    // Update cookie in database
    await db.run("UPDATE downloader SET cookie = ? WHERE url = ?", [newCookie.data, url]);
    logger.info(`Refresh qBittorrent cookie successfully, url: ${url}`, { model: "refreshQbittorrentCookie" });

    // After updating cookie, retry the original request
    return await originalRequest(newCookie.data);
  } catch (error) {
    logger.error(`${error.message}, url: ${url}`, { model: "refreshQbittorrentCookie" });
    throw error;
  }
}

export async function getQbittorrentVersion(url, cookie) {
  try {
    const response = await fetch(`${url}${versionUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    // Refresh cookie if expired
    if (response.status === 403) {
      return await refreshQbittorrentCookie(url, async (newCookie) => {
        return await getQbittorrentVersion(url, newCookie);
      });
    }

    // Get version number
    const version = await response.text();
    const versionNumber = version.replace(/v/g, "");

    logger.debug(`Get qBittorrent version successfully, version: ${versionNumber}, url: ${url}`, { model: "getQbittorrentVersion" });
    return {
      success: true,
      message: "success",
      data: versionNumber
    };
  } catch (error) {
    logger.error(`${error.message}, url: ${url}`, { model: "getQbittorrentVersion" });
    return {
      success: false,
      message: error.message,
      data: "unknown"
    };
  }
}

export async function getQbittorrentTorrents(url, cookie) {
  try {
    const response = await fetch(`${url}${torrentsUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    // Refresh cookie if expired
    if (response.status === 403) {
      return await refreshQbittorrentCookie(url, async (newCookie) => {
        return await getQbittorrentVersion(url, newCookie);
      });
    }

    const torrents = await response.json();

    logger.debug(`Get qBittorrent torrents successfully, url: ${url}`, { model: "getQbittorrentTorrents" });
    return {
      success: true,
      message: "success",
      data: torrents
    };
  } catch (error) {
    logger.error(`${error.message}, url: ${url}`, { model: "getQbittorrentTorrents" });
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

export async function manageQbittorrentTorrent(action, url, cookie, hash) {
  try{
    // Get qBittorrent version
    // Update cookie at the same time
    const version = await getQbittorrentVersion(url, cookie);
    if (!version.success) {
      throw new Error(version.message);
    }

    // Use different API for different actions
    // Compatible with v4 and v5
    let manageUrl = "";
    if (action === "download") {
      manageUrl = addUrl;
    } else if (action === "delete") {
      manageUrl = deleteUrl;
    } else if (version.data.startsWith("4") && action === "pause") {
      manageUrl = pauseUrlV4;
    } else if (version.data.startsWith("4") && action === "resume") {
      manageUrl = resumeUrlV4;
    } else if (version.data.startsWith("5") && action === "pause") {
      manageUrl = pauseUrlV5;
    } else if (version.data.startsWith("5") && action === "resume") {
      manageUrl = resumeUrlV5;
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    // Create torrent link from hash
    // Must use FormData to add torrent
    const formData = new FormData();
    formData.append("urls", magnet(hash));

    const response = await fetch(`${url}${manageUrl}`, {
      method: "POST",
      headers: { 
        "Cookie": `SID=${cookie}`,
        ...(action === "download" ? {} : { "Content-Type": "application/x-www-form-urlencoded" })
      },
      body: action === "download" ? formData : `hashes=${hash}${action === "delete" ? "&deleteFiles=false" : ""}`
    });

    if (!response.ok) {
      throw new Error(`${response.statusText}, action: ${action}, hash: ${hash}`);
    }

    logger.debug(`Manage qBittorrent torrent successfully, action: ${action}, hash: ${hash}, url: ${url}`, { model: "manageQbittorrentTorrent" });
    return {
      success: true,
      message: "success"
    };
  } catch (error) {
    logger.error(`${error.message}, url: ${url}`, { model: "manageQbittorrentTorrent" });
    return {
      success: false,
      message: error.message
    };
  }
}
