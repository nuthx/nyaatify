import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendResponse } from "@/lib/http/response";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get downloader list with downloader version and online state

export async function GET(request) {
  try {
    const downloaders = await prisma.downloader.findMany({
      orderBy: {
        name: "asc"
      }
    });

    // Get all downloaders' version and online state
    const downloadersWithState = await Promise.all(downloaders.map(async downloader => {
      const version = await getQbittorrentVersion(downloader.url, downloader.cookie);
      const state = version.success ? "online" : "offline";
      return {
        ...downloader,
        version: version.data,
        state
      };
    }));

    return sendResponse(request, {
      data: { downloaders: downloadersWithState }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Add a new downloader
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

    // Check if name is empty
    if (!data.name) {
      throw new Error("Downloader name is required");
    }

    // Check if name or URL already exists
    const existingDownloader = await prisma.downloader.findFirst({
      where: {
        OR: [
          { name: data.name },
          { url: data.url }
        ]
      }
    });

    if (existingDownloader) {
      if (existingDownloader.name === data.name) {
        throw new Error(`Downloader already exists, name: ${data.name}`);
      } else {
        throw new Error(`Downloader already exists, url: ${data.url}`);
      }
    }

    // Get downloader cookie
    // This will check if the connection is successful
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

    // Create downloader
    await prisma.downloader.create({
      data: {
        name: data.name,
        url: data.url,
        type: data.type,
        username: data.username,
        password: data.password,
        cookie: cookieResult.data
      }
    });

    // Get the current value to determine if update is needed
    const config = await prisma.config.findUnique({
      where: { key: "defaultDownloader" }
    });

    // Update default downloader only if empty
    if (!config.value) {
      await prisma.config.update({
        where: { key: "defaultDownloader" },
        data: { value: data.name }
      });
      logger.info(`Set default downloader to ${data.name}`, { model: "POST /api/downloaders" });
    }

    return sendResponse(request, {
      message: `Add downloader successfully, name: ${data.name}, type: ${data.type}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
