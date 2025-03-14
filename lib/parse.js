import Parser from "rss-parser";
import { parse } from "anitomy"
import { prisma, getConfig } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { parseWithOpenAI } from "@/lib/api/openai";
import { searchAnilistDetails } from "@/lib/api/anilist";
import { getBangumiDetails, searchBangumiDetails } from "@/lib/api/bangumi";
import { getBangumiIdFromMikan } from "@/lib/api/mikan";
import { sendNotification } from "@/lib/notification";
import { logger } from "@/lib/logger";

export async function refreshRSS(name) {
  try {
    // Get rss from database
    const rss = await prisma.rss.findUnique({
      where: { name }
    });

    // Get dedicated parser configured for different rss type
    const parserConfigs = {
      Nyaa: { customFields: { item: [
        ["nyaa:infoHash", "hash"],
        ["nyaa:categoryId", "category_id"],
        ["nyaa:size", "size"]
      ]}},
      Mikan: { customFields: { item: [
        ["torrent", "torrent"]
      ]}}
    };

    // Set parser config for different rss type
    const config = parserConfigs[rss.type];
    if (!config) {
      throw new Error(`Invalid type: ${rss.type}`);
    }

    // Set rss state to running in database before parsing
    await prisma.rss.update({
      where: { name },
      data: { state: 0 }
    });
    logger.info(`Start refreshing, rss: ${name}`, { model: "refreshRSS" });

    // Parse
    const parser = new Parser(config);
    const parsedRssData = await parser.parseURL(rss.url);
    for (const item of parsedRssData.items) {
      try {
        // Extract hash from url for mikan rss
        if (rss.type === "Mikan") {
          item.hash = item.link.split("/").pop();
        }

        // Skip if the anime exists, checked by hash
        const existingAnime = await prisma.anime.findUnique({
          where: { hash: item.hash }
        });

        if (!existingAnime) {
          // Parse anime data
          let animeData;
          if (rss.type === "Nyaa") {
            animeData = await parseNyaaAnime(item);
          } else if (rss.type === "Mikan") {
            animeData = await parseMikanAnime(item);
          }

          // Insert to anime table
          await prisma.anime.create({
            data: {
              ...animeData,
              rss: {
                connect: {
                  id: rss.id
                }
              }
            }
          });
          
          logger.info(`Insert anime data successfully, anime: ${item.hash}, rss: ${name}`, { model: "refreshRSS" });

          // Send notification
          await sendNotification(name, animeData, rss.refresh_count);
        } else {
          // If anime exists, just connect it with the rss
          await prisma.anime.update({
            where: { hash: item.hash },
            data: {
              rss: {
                connect: {
                  id: rss.id
                }
              }
            }
          });
        }
      } catch (error) {
        logger.error(`Failed to insert anime data, anime: ${item.hash}, error: ${error.message}`, { model: "refreshRSS" });
      }
    }

    // Set state to completed, update refresh time, and increase refresh count
    await prisma.rss.update({
      where: { name },
      data: {
        state: 1,
        refreshed_at: new Date(),
        refresh_count: { increment: 1 }
      }
    });
    logger.info(`Refresh completed, rss: ${name}`, { model: "refreshRSS" });
  } catch (error) {
    // Set state and refresh time even if error occurs, but don't increase refresh count
    await prisma.rss.update({
      where: { name },
      data: {
        state: 1,
        refreshed_at: new Date()
      }
    });
    logger.error(`${error.message}, rss: ${name}`, { model: "refreshRSS" });
  }
}

async function parseNyaaAnime(item) {
  let name = null
  let anilist = null;
  let bangumi = null;

  if (item.category_id.startsWith("1_")) {
    name = await extractTitle(item.title);
    if(name) {
      anilist = await searchAnilistDetails(name);
      if (anilist?.data?.title?.native) {
        bangumi = await searchBangumiDetails(anilist.data.title.native);
      }
    }
  } else {
    logger.warn(`Skip parse due to category is not anime, anime: ${item.hash}, category: ${item.category_id}`, { model: "parseNyaaAnime" });
  }

  logger.debug(`Parse anime data successfully, anime: ${item.hash}`, { model: "parseNyaaAnime" });
  return {
    hash: item.hash,
    title_raw: item.title,
    title_prased: name || "",
    title_jp: anilist?.data?.title?.native || "",
    title_cn: bangumi?.data?.title_cn || "",
    title_en: anilist?.data?.title?.english || "",
    title_romaji: anilist?.data?.title?.romaji || "",
    torrent: item.link,
    pub_date: new Date(item.pubDate).toISOString(),
    size: item.size,
    category_id: item.category_id,
    cover_anilist: anilist?.data?.coverImage?.extraLarge || "",
    cover_bangumi: bangumi?.data?.images?.common || "",
    page_anilist: anilist?.data?.id ? `https://anilist.co/anime/${anilist.data.id}` : "",
    page_bangumi: bangumi?.data?.id ? `https://bgm.tv/subject/${bangumi.data.id}` : "",
    created_at: new Date().toISOString()
  };
}

async function parseMikanAnime(item) {
  let bangumi = null;
  let anilist = null;

  const bangumiId = await getBangumiIdFromMikan(item.torrent.link[0]);
  if (bangumiId.success) {
    bangumi = await getBangumiDetails(bangumiId.data);
    if (bangumi.success) {
      anilist = await searchAnilistDetails(bangumi.data.name);
    }
  } else {
    logger.warn(`Unable to get bangumi ID, anime: ${item.hash}`, { model: "parseMikanAnime" });
  }

  logger.debug(`Parse anime data successfully, anime: ${item.hash}`, { model: "parseMikanAnime" });
  return {
    hash: item.hash,
    title_raw: item.title,
    title_prased: "",
    title_jp: bangumi?.data?.name || "",
    title_cn: bangumi?.data?.title_cn || "",
    title_en: anilist?.data?.title?.english || "",
    title_romaji: anilist?.data?.title?.romaji || "",
    torrent: item.enclosure.url,
    pub_date: new Date(item.torrent.pubDate).toISOString(),
    size: formatBytes(item.enclosure.length || 0),
    category_id: "",
    cover_anilist: anilist?.data?.coverImage?.extraLarge || "",
    cover_bangumi: bangumi?.data?.images?.common || "",
    page_anilist: anilist?.data?.id ? `https://anilist.co/anime/${anilist.data.id}` : "",
    page_bangumi: bangumi?.data?.id ? `https://bgm.tv/subject/${bangumi.data.id}` : "",
    created_at: new Date().toISOString()
  };
}

async function extractTitle(title) {
  // Get parse method from config
  const config = await getConfig();

  // AI priority
  if (config.ai_priority === "ai") {
    // Extract title with AI first
    const aiResult = await extractTitleWithAI(title);
    // If no result of AI, use local parse
    if (!aiResult) {
      logger.warn(`AI extraction failed, attempting local extraction, title: ${title}`, { model: "extractTitle" });
      return extractTitleWithAnitomy(title);
    }
    return aiResult;
  }

  // Local priority
  return extractTitleWithAnitomy(title);
}

function extractTitleWithAnitomy(title) {
  // Remove invalid content from the title to avoid parsing failure
  const cleanedTitle = title
    .replace("BD-BOX", "")
    .replace("BD", "")
    .replace("DVD-BOX", "")
    .replace("DVD", "")
    .replace("- TV", "")
    .replace("+ OAD", "");

  // Parse the title with Anitomy
  const parsed = parse(cleanedTitle);

  if (!parsed || !parsed.title) {
    logger.warn(`Local extraction failed, title: ${title}`, { model: "extractTitleWithAnitomy" });
    return null;
  }

  // Some anime has more than one titles with different language, split by "/"
  // Anitomy cannot identify whether the title is composed of one or multiple titles
  // So it's needed to extract the English title due to search engine is Anilist
  // If title is too short, slash may be part of the title, like 22/7
  if (parsed.title.includes("/") && parsed.title.length > 15) {
    return splitEnglishTitle(parsed.title);
  }

  logger.debug(`Local extraction successful, title: ${parsed.title}, result: ${parsed.title}`, { model: "extractTitleWithAnitomy" });
  return parsed.title;
}

function splitEnglishTitle(title) {
  let maxEnglishRatio = 0;
  let bestTitle = null;

  // Split title by "/" then trim each part
  // Calculate the ratio of English characters to total characters
  // The highest ratio part may be the English title
  const parts = title.split("/").map(part => part.trim());
  for (const part of parts) {
    const totalChars = part.length;
    if (totalChars === 0) continue;

    const englishAndNumbers = part.match(/[a-zA-Z0-9]/g)?.length || 0;
    const ratio = englishAndNumbers / totalChars;

    if (ratio > maxEnglishRatio) {
      maxEnglishRatio = ratio;
      bestTitle = part;
    }
  }

  logger.debug(`Split English title successfully, title: ${title}, result: ${bestTitle}`, { model: "splitEnglishTitle" });
  return bestTitle;
}

export async function extractTitleWithAI(title) {
  // Get AI config from config
  const config = await getConfig();

  // Check if AI config exists
  if (!config.ai_api || !config.ai_key || !config.ai_model) {
    logger.error("Missing config of AI server", { model: "extractTitleWithAI" });
    return null;
  }

  // Extract title with AI
  const result = await parseWithOpenAI(title, config);
  if (!result.success) {
    logger.warn(`AI extraction failed, title: ${title}`, { model: "extractTitleWithAI" });
    return null;
  }

  logger.debug(`AI extraction successful, title: ${title}, result: ${result.data}`, { model: "extractTitleWithAI" });
  return result.data;
}
