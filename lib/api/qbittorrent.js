import { prisma } from "@/lib/db";
import { magnet } from "@/lib/magnet";
import { logger } from "@/lib/logger";

const QB_API = {
  LOGIN: "/api/v2/auth/login",
  VERSION: "/api/v2/app/version",
  TORRENTS: "/api/v2/torrents/info",
  ADD: "/api/v2/torrents/add",
  DELETE: "/api/v2/torrents/delete",
  PAUSE: {
    V4: "/api/v2/torrents/pause",
    V5: "/api/v2/torrents/stop"
  },
  RESUME: {
    V4: "/api/v2/torrents/resume",
    V5: "/api/v2/torrents/start"
  }
};

export const QB_STATE = {
  "working": [
    "allocating",
    "uploading",
    "queuedUP",
    "stalledUP",
    "checkingUP",
    "forcedUP",
    "downloading",
    "metaDL",
    "queuedDL",
    "stalledDL",
    "checkingDL",
    "forcedDL",
    "checkingResumeData",
    "moving"
  ],
  "stalled": [
    "error",
    "missingFiles",
    "pausedUP",
    "stoppedUP",
    "pausedDL",
    "stoppedDL",
    "unknown",
  ]
};

export async function getQbittorrentCookie(url, username, password) {
  try {
    const response = await fetch(`${url}${QB_API.LOGIN}`, {
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
    const downloader = await prisma.downloader.findUnique({
      where: { url }
    });

    // Get new cookie
    const newCookie = await getQbittorrentCookie(url, downloader.username, downloader.password);
    if (!newCookie.success) {
      throw new Error(newCookie.message);
    }

    // Update cookie in database
    await prisma.downloader.update({
      where: { url },
      data: { cookie: newCookie.data }
    });
    
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
    const response = await fetch(`${url}${QB_API.VERSION}`, {
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
    const response = await fetch(`${url}${QB_API.TORRENTS}`, {
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
      manageUrl = QB_API.ADD;
    } else if (action === "delete") {
      manageUrl = QB_API.DELETE;
    } else if (version.data.startsWith("4") && action === "pause") {
      manageUrl = QB_API.PAUSE.V4;
    } else if (version.data.startsWith("4") && action === "resume") {
      manageUrl = QB_API.RESUME.V4;
    } else if (version.data.startsWith("5") && action === "pause") {
      manageUrl = QB_API.PAUSE.V5;
    } else if (version.data.startsWith("5") && action === "resume") {
      manageUrl = QB_API.RESUME.V5;
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    // Create torrent link from hash
    // Must use FormData to add torrent
    const formData = new FormData();
    formData.append("urls", await magnet(hash));

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
