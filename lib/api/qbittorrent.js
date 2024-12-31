import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

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

async function refreshQbittorrentCookie(url) {
  try {
    const db = await getDb();
    const server = await db.get("SELECT username, password FROM server WHERE url = ?", url);
    
    const newCookie = await getQbittorrentCookie(url, server.username, server.password);
    if (newCookie.includes("Error")) {
      log.error("Failed to get new cookie");
      return null;
    }

    await db.run("UPDATE server SET cookie = ? WHERE url = ?", [newCookie, url]);
    log.info("Updated qBittorrent cookie");
    return newCookie;
  }
  
  catch (error) {
    log.error(`Failed to refresh qBittorrent cookie: ${error.message}`);
    return null;
  }
}

export async function getQbittorrentVersion(url, cookie, retryCount = 0) {
  try {
    const response = await fetch(`${url}${versionUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    // Refresh cookie if expired
    if (response.status === 403 && retryCount === 0) {
      const newCookie = await refreshQbittorrentCookie(url);
      if (!newCookie) return "unknown";
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

export async function getQbittorrentTorrents(url, cookie, retryCount = 0) {
  try {
    const response = await fetch(`${url}${torrentsUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    // Refresh cookie if expired
    if (response.status === 403 && retryCount === 0) {
      const newCookie = await refreshQbittorrentCookie(url);
      if (!newCookie) return [];
      return await getQbittorrentTorrents(url, newCookie, retryCount + 1);
    }

    if (!response.ok) {
      log.error(`Failed to get qBittorrent torrents, ${response.statusText}`);
      return [];
    }

    const torrents = await response.json();
    return torrents;
  }

  catch (error) {
    log.error("Error: Failed to get qBittorrent torrents");
    return [];
  }
}

export async function addQbittorrentTorrent(url, cookie, hash, retryCount = 0) {
  try {
    const formData = new FormData();
    formData.append('urls', `magnet:?xt=urn:btih:${hash}`);

    const response = await fetch(`${url}${addUrl}`, {
      method: "POST",
      headers: { "Cookie": `SID=${cookie}` },
      body: formData
    });

    // Refresh cookie if expired
    if (response.status === 403 && retryCount === 0) {
      const newCookie = await refreshQbittorrentCookie(url);
      if (!newCookie) return false;
      return await addQbittorrentTorrent(url, newCookie, hash, retryCount + 1);
    }

    if (!response.ok) {
      log.error(`Failed to add torrent: ${response.statusText}`);
      return false;
    }

    return true;
  }

  catch (error) {
    log.error(`Failed to add torrent: ${error.message}`);
    return false;
  }
}

export async function manageQbittorrentTorrent(action, url, cookie, hash, retryCount = 0) {
  try{
    // Get qBittorrent version
    const version = await getQbittorrentVersion(url, cookie);
    if (version === "unknown") {
      return false;
    }

    // Compatible with v4 and v5
    let manageUrl = "";
    if (action === "delete") {
      manageUrl = deleteUrl;
    } else if (version.startsWith("4") && action === "pause") {
      manageUrl = pauseUrlV4;
    } else if (version.startsWith("4") && action === "resume") {
      manageUrl = resumeUrlV4;
    } else if (version.startsWith("5") && action === "pause") {
      manageUrl = pauseUrlV5;
    } else if (version.startsWith("5") && action === "resume") {
      manageUrl = resumeUrlV5;
    } else {
      return false;
    }

    const response = await fetch(`${url}${manageUrl}`, {
      method: "POST",
      headers: { 
        "Cookie": `SID=${cookie}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: action === "delete" ? `hashes=${hash}&deleteFiles=false` : `hashes=${hash}`
    });

    // Refresh cookie if expired
    if (response.status === 403 && retryCount === 0) {
      const newCookie = await refreshQbittorrentCookie(url);
      if (!newCookie) return false;
      return await manageQbittorrentTorrent(action, url, newCookie, hash, retryCount + 1);
    }

    if (!response.ok) {
      log.error(`Failed to ${action} qBittorrent torrent: ${response.statusText}`);
      return false;
    }

    return true;
  }

  catch (error) {
    log.error(`Failed to ${action} qBittorrent torrent: ${error.message}`);
    return false;
  }
}
