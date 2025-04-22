import * as cheerio from "cheerio";
import { marked } from "marked";
import { prisma } from "@/lib/db";
import { parserConfig } from "@/lib/core/parser/config";
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

    // Import the specific parser module
    const currentConfig = parserConfig.find(c => c.type === anime.source);
    const parserModule = await import(`@/lib/core/parser/${currentConfig.parser}`);

    // Get source content from source url
    const res = await fetch(anime.sourceUrl);
    const html = await res.text();
    const desc = parserModule.extractDescription(html);

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
