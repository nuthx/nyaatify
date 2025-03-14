import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getQbittorrentCookie, getQbittorrentVersion } from "@/lib/api/qbittorrent";

// Get downloader list with downloader version and online state

export async function GET() {
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

    return Response.json({
      code: 200,
      message: "success",
      data: {
        downloaders: downloadersWithState
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/downloaders" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new downloader
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

    // Check if name is empty
    if (!data.values.name?.trim()) {
      throw new Error("Downloader name is required");
    }

    // Check if name or URL already exists
    const existingDownloader = await prisma.downloader.findFirst({
      where: {
        OR: [
          { name: data.values.name.trim() },
          { url: data.values.url.trim() }
        ]
      }
    });

    if (existingDownloader) {
      if (existingDownloader.name === data.values.name.trim()) {
        throw new Error(`Downloader already exists, name: ${data.values.name}`);
      } else {
        throw new Error(`Downloader already exists, url: ${data.values.url}`);
      }
    }

    // Get downloader cookie
    // This will check if the connection is successful
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

    // Create downloader
    await prisma.downloader.create({
      data: {
        name: data.values.name.trim(),
        url: data.values.url.trim(),
        type: data.values.type.trim(),
        username: data.values.username,
        password: data.values.password,
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
        data: { value: data.values.name }
      });
      logger.info(`Set default downloader to ${data.values.name}`, { model: "POST /api/downloaders" });
    }

    logger.info(`Add downloader successfully, name: ${data.values.name}, type: ${data.values.type}`, { model: "POST /api/downloaders" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/downloaders" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
