import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { dynamicImport } from "@/lib/core/dynamic";
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

    // Dynamic import
    const { currentConfig, parserModule } = await dynamicImport(rss.type);

    // Parse anime data by rss-parser
    const parser = new Parser({
      customFields: {
        item: currentConfig.fields
      }
    });
    const parsedAnimeData = await parser.parseURL(rss.url);

    // Update anime data in database
    for (const item of parsedAnimeData.items) {
      const hash = parserModule.animeHash(item);
      try {
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
              titleJp: animeData?.anilist?.title?.native || animeData?.bangumi?.name || "",
              titleCn: animeData?.bangumi?.name_cn || "",
              titleEn: animeData?.anilist?.title?.english || "",
              titleRomaji: animeData?.anilist?.title?.romaji || "",
              torrent: animeData.torrent,
              pubDate: new Date(animeData.pubDate).toISOString(),
              size: animeData.size,
              coverAnilist: animeData?.anilist?.coverImage?.extraLarge || "",
              coverBangumi: animeData?.bangumi?.images?.large || "",
              idAnilist: animeData?.anilist?.id?.toString() || "",
              idBangumi: animeData?.bangumi?.id?.toString() || "",
              source: rss.type,
              sourceUrl: animeData.url,
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
    logger.info(`Refresh completed, rss: ${RSSName}`, { model: "parseRSS" });
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
