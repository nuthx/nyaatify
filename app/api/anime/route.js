import { prisma, getConfig } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { sendResponse } from "@/lib/http/response";
import { getQbittorrentVersion, getQbittorrentTorrents } from "@/lib/api/qbittorrent";

// Get anime list with pagination
// Params: page, number, optional, default: 1
//         size, number, optional, default: 20

export async function GET(request) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const size = parseInt(request.nextUrl.searchParams.get("size") || "20");

    const [anime, total, todayCount, weekCount, downloaders] = await Promise.all([
      // Get anime data with pagination
      prisma.anime.findMany({
        take: size,
        skip: (page - 1) * size,
        orderBy: {
          pubDate: "desc"
        },
        include: {
          rss: {
            select: {
              name: true
            }
          }
        }
      }),
      // Get total count
      prisma.anime.count(),
      // Get today count
      prisma.anime.count({
        where: {
          pubDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      // Get week count
      prisma.anime.count({
        where: {
          pubDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Get downloader list
      prisma.downloader.findMany()
    ]);

    // Get config
    const config = await getConfig();

    // Check if default downloader is online
    let defaultOnline = "0";
    if (config.defaultDownloader) {
      const defaultDownloaderInfo = downloaders.find(downloader => downloader.name === config.defaultDownloader);
      const version = await getQbittorrentVersion(defaultDownloaderInfo.url, defaultDownloaderInfo.cookie);
      defaultOnline = version.success ? "1" : "0";
    }

    // Get all torrents to match anime download status
    const allTorrents = (await Promise.all(downloaders.map(async downloader => {
      const torrentsResult = await getQbittorrentTorrents(downloader.url, downloader.cookie);
      return torrentsResult.data.map(t => ({...t, downloader_name: downloader.name}));
    }))).flat();

    // Process anime data with rss names and downloader status
    const processedAnime = anime.map(item => ({
      ...item,
      downloader: (() => {
        const matchingTorrent = allTorrents.find(t => t.hash.toLowerCase() === item.hash.toLowerCase());
        return matchingTorrent ? {
          name: matchingTorrent.downloader_name,
          state: matchingTorrent.state,
          progress: matchingTorrent.progress,
          completed: formatBytes(matchingTorrent.completed),
          size: formatBytes(matchingTorrent.size)
        } : null;
      })()
    }));

    return sendResponse(request, {
      data: {
        anime: processedAnime,
        count: {
          today: todayCount,
          week: weekCount,
          total: total
        },
        pagination: {
          total: total,
          size: size,
          current: page
        },
        config: {
          defaultDownloader: config.defaultDownloader,
          defaultDownloaderOnline: defaultOnline,
          showDownloaderState: config.showDownloaderState,
          titlePriority: config.titlePriority,
          coverSource: config.coverSource
        }
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
