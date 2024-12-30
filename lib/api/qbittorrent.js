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
      throw new Error("Failed to login to qBittorrent");
    }

    // Get cookie from response headers
    const cookies = response.headers.get("set-cookie");
    if (!cookies) {
      throw new Error("Login failed, please check your username and password");
    }

    // Extract SID cookie
    const sidMatch = cookies.match(/SID=([^;]+)/);
    if (!sidMatch) {
      throw new Error("Could not find SID cookie");
    }

    return sidMatch[1];
  }
  
  catch (error) {
    if (error.message.includes("fetch failed")) {
      throw new Error("Login failed, please check your URL link");
    }
    throw error;
  }
}

export async function getQbittorrentVersion(url, cookie) {
  try {
    const response = await fetch(`${url}${versionUrl}`, {
      headers: { "Cookie": `SID=${cookie}` }
    });

    if (!response.ok) {
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
