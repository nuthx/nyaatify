import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { logger } from "@/lib/logger";
import { sendNotification } from "@/lib/core/notification";

export async function parseRSS(RSSName) {
  try {
    logger.info(`Start refreshing, rss: ${RSSName}`, { model: "parseRSS" });
    const rss = await prisma.rss.findUnique({
      where: { name: RSSName }
    });

    // Set RSS state to 0 (running)
    await prisma.rss.update({
      where: { name: RSSName },
      data: { state: 0 }
    });

    // Import the specific parser module
    const parserModule = await import(`@/lib/core/parser/${rss.type.toLowerCase()}.js`);

    // Parse anime data by rss-parser
    const parser = new Parser(parserModule.parserConfig);
    const parsedAnimeData = await parser.parseURL(rss.url);

    // Update anime data in database
    for (const item of parsedAnimeData.items) {
      try {
        const hash = parserModule.animeHash(item);
        const existingAnime = await prisma.anime.findUnique({
          where: { hash }
        });

        // If anime already exists, connect it with rss id
        if (existingAnime) {
          await prisma.anime.update({
            where: { hash },
            data: {
              rss: {
                connect: { id: rss.id }
              }
            }
          });
        }

        // If else, fetch data, insert to database and send notification
        else {
          const animeData = await parserModule.fetchAnimeData(item);

          await prisma.anime.create({
            data: {
              hash,
              titleRaw: animeData.titleRaw,
              titleParsed: animeData.titleParsed || "",
              titleJp: animeData.anilist.title.native || animeData.bangumi.name || "",
              titleCn: animeData.bangumi.name_cn || "",
              titleEn: animeData.anilist.title.english || "",
              titleRomaji: animeData.anilist.title.romaji || "",
              torrent: animeData.torrent,
              pubDate: new Date(animeData.pubDate).toISOString(),
              size: formatBytes(animeData.size),
              coverAnilist: animeData.anilist.coverImage.extraLarge || "",
              coverBangumi: animeData.bangumi.images.common || "",
              pageAnilist: animeData.anilist.id ? `https://anilist.co/anime/${animeData.anilist.id}` : "",
              pageBangumi: animeData.bangumi.id ? `https://bgm.tv/subject/${animeData.bangumi.id}` : "",
              rss: {
                connect: {
                  id: rss.id
                }
              }
            }
          });

          logger.info(`Insert anime data successfully, anime: ${hash}, rss: ${rss.name}`, { model: "parseRSS" });
          await sendNotification(rss.name, animeData, rss.refreshCount);
        }
      } catch (error) {
        logger.error(`Failed to insert anime data, anime: ${hash}, error: ${error.message}`, { model: "parseRSS" });
      }
    }

    // Set state to 1 (completed)
    await prisma.rss.update({
      where: { name: RSSName },
      data: {
        state: 1,
        refreshedAt: new Date(),
        refreshCount: { increment: 1 }
      }
    });
    logger.info(`Refresh completed, rss: ${RSSName}`, { model: "refreshRSS" });
  } catch (error) {
    // Set state to 1 without increasing refresh count
    await prisma.rss.update({
      where: { name: RSSName },
      data: {
        state: 1,
        refreshedAt: new Date()
      }
    });
    logger.error(`Failed to refresh rss: ${error.message}`, { model: "parseRSS" });
  }
}
