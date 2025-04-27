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

    return sendResponse(request, {
      data: {
        ...anime,
        titleFirst: await getTitleFirst(anime)
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
