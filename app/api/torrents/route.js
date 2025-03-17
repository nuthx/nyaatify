import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { sendResponse } from "@/lib/http/response";
import { getQbittorrentVersion, getQbittorrentTorrents, manageQbittorrentTorrent } from "@/lib/api/qbittorrent";

// Get torrent list

export async function GET(request) {
  try {
    // Get all downloaders and check their online status
    const downloaders = await prisma.downloader.findMany();
    const downloaderStatuses = await Promise.all(
      downloaders.map(async downloader => {
        const version = await getQbittorrentVersion(downloader.url, downloader.cookie);
        return {
          ...downloader,
          isOnline: version.success
        };
      })
    );
    const onlineDownloaders = downloaderStatuses.filter(downloader => downloader.isOnline);

    // Get torrents from online downloaders
    const allTorrents = [];
    await Promise.all(onlineDownloaders.map(async downloader => {
      const torrentsResult = await getQbittorrentTorrents(downloader.url, downloader.cookie);
      torrentsResult.data.forEach(torrent => {
        allTorrents.push({
          name: torrent.name,
          hash: torrent.hash,
          state: torrent.state,
          progress: torrent.progress,
          eta: torrent.eta,
          dlspeed: formatBytes(torrent.dlspeed),
          upspeed: formatBytes(torrent.upspeed),
          completed: formatBytes(torrent.completed),
          size: formatBytes(torrent.size),
          added_on: torrent.added_on,
          downloader: downloader.name
        });
      });
    }));

    // Sort by added_on desc, name, downloader
    allTorrents.sort((a, b) => {
      if (a.added_on !== b.added_on) {
        return b.added_on - a.added_on;
      }
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.downloader.localeCompare(b.downloader);
    });

    return sendResponse(request, {
      data: {
        torrents: allTorrents,
        downloaders: downloaders.length,  // Total downloaders count
        online: onlineDownloaders.length  // Online downloaders count
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Manage a torrent
// Body: {
//   action: string, required, type: download, pause, resume, delete
//   downloader: string, required
//   hash: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Get downloader info
    const downloader = await prisma.downloader.findUnique({
      where: { name: data.downloader }
    });

    if (!downloader) {
      throw new Error(`Downloader not found, name: ${data.downloader}`);
    }

    // Manage the torrent
    const manageResult = await manageQbittorrentTorrent(data.action, downloader.url, downloader.cookie, data.hash);
    if (!manageResult.success) {
      throw new Error(manageResult.message);
    }

    return sendResponse(request, {
      message: `Manage torrent successfully, action: ${data.action}, hash: ${data.hash}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
