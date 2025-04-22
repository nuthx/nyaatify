import { prisma } from "@/lib/db";
import { dynamicImport } from "@/lib/core/dynamic";
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

    // Dynamic import
    const { parserModule } = await dynamicImport(anime.source);

    // Get source content from source url
    const res = await fetch(anime.sourceUrl);
    const html = await res.text();
    const desc = parserModule.extractDescription(html);

    return sendResponse(request, {
      data: {
        type: anime.source,
        content: desc
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
