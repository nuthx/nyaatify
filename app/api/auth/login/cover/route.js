import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Get cover image of login page

export async function GET(request) {
  try {
    // Default cover images
    let coverAnilist = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-LC4jviSX8sMZ.png";
    let coverBangumi = "https://lain.bgm.tv/r/400/pic/cover/l/13/c5/400602_ZI8Y9.jpg";

    // Get all Anilist covers
    const anilistAnimes = await prisma.anime.findMany({
      where: {
        coverAnilist: { not: "" }
      },
      select: {
        coverAnilist: true
      }
    });

    // Get all Bangumi covers
    const bangumiAnimes = await prisma.anime.findMany({
      where: {
        coverBangumi: { not: "" }
      },
      select: {
        coverBangumi: true
      }
    });

    // Randomly select one cover from Anilist list
    if (anilistAnimes.length > 0) {
      const randomIndex = Math.floor(Math.random() * anilistAnimes.length);
      coverAnilist = anilistAnimes[randomIndex].coverAnilist;
    }

    // Randomly select one cover from Bangumi list
    if (bangumiAnimes.length > 0) {
      const randomIndex = Math.floor(Math.random() * bangumiAnimes.length);
      coverBangumi = bangumiAnimes[randomIndex].coverBangumi;
    }

    return sendResponse(request, {
      message: "Cover image fetched",
      data: { 
        coverAnilist,
        coverBangumi
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
