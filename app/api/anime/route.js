import { prisma } from "@/lib/db";
import { getTitleFirst } from "@/lib/title";
import { sendResponse } from "@/lib/http/response";

// Get anime list with pagination
// Params: page, number, optional, default: 1
//         size, number, optional, default: 20

export async function GET(request) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const size = parseInt(request.nextUrl.searchParams.get("size") || "20");
    const rss = request.nextUrl.searchParams.get("rss");

    // Create where condition based on rss parameter
    const whereCondition = rss ? {
      rss: {
        some: {
          name: rss
        }
      }
    } : {};

    const [anime, total, todayCount, weekCount, rssList] = await Promise.all([
      // Get anime data with pagination
      prisma.anime.findMany({
        take: size,
        skip: (page - 1) * size,
        where: whereCondition,
        orderBy: {
          pubDate: "desc"
        },
        include: {
          rss: { select: { name: true } }
        }
      }),
      // Get total count
      prisma.anime.count({
        where: whereCondition
      }),
      // Get today count
      prisma.anime.count({
        where: {
          ...whereCondition,
          pubDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      // Get week count
      prisma.anime.count({
        where: {
          ...whereCondition,
          pubDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Get all RSS names
      prisma.rss.findMany({
        select: {
          name: true
        }
      })
    ]);

    return sendResponse(request, {
      data: {
        anime: await Promise.all(
          anime.map(async (item) => ({
            ...item,
            titleFirst: await getTitleFirst(item)
          }))
        ),
        rss: {
          current: rss || "",
          list: rssList.map(r => r.name)
        },
        count: {
          today: todayCount,
          week: weekCount,
          total: total
        },
        pagination: {
          current: page,
          size: size,
          total: total
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
