import { prisma } from "@/lib/db";
import { getTitleFirst } from "@/lib/title";
import { sendResponse } from "@/lib/http/response";

// Get anime detail by hash
// Params: hash, string, required
export async function GET(request, { params }) {
  try {
    const hash = (await params).hash;

    const anime = await prisma.anime.findUnique({
      where: {
        hash: hash,
      },
      include: {
        rss: { select: { name: true } },
      },
    });

    if (!anime) {
      throw new Error("No anime found");
    }

    // Get source content from source url
    const res = await fetch(anime.sourceUrl);
    const html = await res.text();
    let match = null;
    if (anime.source === "Nyaa") {
      match = html.match(/id="torrent-description"[^>]*>([\s\S]*?)<\/div>/i);
    } else {
      match = html.match(/class="episode-desc"[^>]*>([\s\S]*?)(?=<\/div>\s*<a href="#0")/i);
    }
    const desc = match ? match[1].trim() : "";

    return sendResponse(request, {
      data: {
        ...anime,
        titleFirst: await getTitleFirst(anime),
        sourceContent: desc.replace(/&#10;/g, "\n")
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
