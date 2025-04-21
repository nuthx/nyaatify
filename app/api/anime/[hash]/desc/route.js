import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Get anime description from source url
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
    const $ = cheerio.load(html);
    let desc = "";
    if (anime.source === "Nyaa") {
      desc = $("#torrent-description").html();
    } else {
      desc = $(".episode-desc").children().first().remove();  // Remove the hidden tmall advertisement
      desc = $(".episode-desc").html();
    }

    return sendResponse(request, {
      data: {
        type: anime.source,
        content: desc.replace(/&#10;/g, "\n")
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
