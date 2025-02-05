import Parser from "rss-parser";
import { parse } from "anitomy"
import { getDb } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { parseByOpenAI } from "@/lib/api/openai";
import { searchAnilistDetails } from "@/lib/api/anilist";
import { getBangumiDetails, searchBangumiDetails } from "@/lib/api/bangumi";
import { getBangumiId } from "@/lib/api/mikan";
import { logger } from "@/lib/logger";

export async function parseRSS(rssId, name, url, type) {
  try {
    const db = await getDb();

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
    const config = parserConfigs[type];
    if (!config) {
      throw new Error("Unable to parse RSS subscription due to unknown type");
    }

    // Set rss state to running in database before parsing
    await db.run("UPDATE rss SET state = 'running' WHERE id = ?", [rssId]);
    logger.info(`Start refreshing ${name} as ${type}`, { model: "parseRSS" });

    // Parse
    const parser = new Parser(config);
    const rss = await parser.parseURL(url);
    for (const item of rss.items) {
      // Extract hash from url for mikan rss
      if (type === "Mikan") {
        item.hash = item.link.split("/").pop();
      }

      // Check if the anime exists by hash
      try {
        const existingAnime = await db.get("SELECT hash FROM anime WHERE hash = ?", [item.hash]);
        if (!existingAnime) {
          if (type === "Nyaa") {
            await parseNyaaAnime(db, item, rssId);
          } else if (type === "Mikan") {
            await parseMikanAnime(db, item, rssId);
          }
          logger.info(`Insert anime data successfully, item: ${item.hash}, rss: ${name}`, { model: "parseRSS" });
        }
      } catch (error) {
        logger.error(`Failed to insert anime data, item: ${item.hash}, rss: ${name}, error: ${error.message}`, { model: "parseRSS" });
      }
    }

    // Set state to completed and update refresh time
    await db.run("UPDATE rss SET state = 'completed', last_refreshed_at = ? WHERE id = ?", [new Date().toISOString(), rssId]);
    logger.info(`${name} has been refreshed completely`, { model: "parseRSS" });
  } catch (error) {
    // Set state and refresh time even if error occurs
    await db.run("UPDATE rss SET state = 'completed', last_refreshed_at = ? WHERE id = ?", [new Date().toISOString(), rssId]);
    logger.error(`Failed to refresh ${name}, error: ${error.message}`, { model: "parseRSS" });
  }
}

async function parseNyaaAnime(db, item, rssId) {
  let name = null
  let anilist = null;
  let bangumi = null;

  if (item.category_id.startsWith("1_")) {
    name = await extractTitle(item.title);
    if(name) {
      anilist = await searchAnilistDetails(name);
      if (anilist?.title?.native) {
        bangumi = await searchBangumiDetails(anilist.title.native);
      }
    }
  } else {
    logger.warn(`Skip parse due to not anime: item ${item.hash}`, { model: "parseNyaaAnime" });
  }

  const animeData = {
    hash: item.hash,
    title: item.title,
    name_title: name || "",
    name_jp: anilist?.title?.native || "",
    name_cn: bangumi?.name_cn || "",
    name_en: anilist?.title?.english || "",
    name_romaji: anilist?.title?.romaji || "",
    torrent: item.link,
    pub_date: new Date(item.pubDate).toISOString(),
    size: item.size,
    category_id: item.category_id,
    cover_anilist: anilist?.coverImage?.extraLarge || "",
    cover_bangumi: bangumi?.images?.common || "",
    link_anilist: anilist?.id ? `https://anilist.co/anime/${anilist.id}` : "",
    link_bangumi: bangumi?.id ? `https://bgm.tv/subject/${bangumi.id}` : "",
    created_at: new Date().toISOString()
  };

  // Insert to anime table
  const columns = Object.keys(animeData).join(", ");
  const placeholders = Object.keys(animeData).map(() => "?").join(", ");
  await db.run(`INSERT INTO anime (${columns}) VALUES (${placeholders})`, Object.values(animeData));
  
  // Insert to rss_anime table
  await db.run("INSERT OR IGNORE INTO rss_anime (anime_hash, rss_id) VALUES (?, ?)", [item.hash, rssId]);
}

async function parseMikanAnime(db, item, rssId) {
  const bangumiId = await getBangumiId(item.torrent.link[0]);
  let bangumi = null;
  let anilist = null;

  if (bangumiId) {
    bangumi = await getBangumiDetails(bangumiId);
    if (bangumi) {
      anilist = await searchAnilistDetails(bangumi.name);
    }
  } else {
    logger.warn(`Unable to get bangumi ID, item: ${item.hash}`, { model: "parseMikanAnime" });
  }

  const animeData = {
    hash: item.hash,
    title: item.title,
    name_title: "",
    name_jp: bangumi?.name || "",
    name_cn: bangumi?.name_cn || "",
    name_en: anilist?.title?.english || "",
    name_romaji: anilist?.title?.romaji || "",
    torrent: item.enclosure.url,
    pub_date: new Date(item.torrent.pubDate).toISOString(),
    size: formatBytes(item.enclosure.length || 0),
    category_id: "",
    cover_anilist: anilist?.coverImage?.extraLarge || "",
    cover_bangumi: bangumi?.images?.common || "",
    link_anilist: anilist?.id ? `https://anilist.co/anime/${anilist.id}` : "",
    link_bangumi: bangumi?.id ? `https://bgm.tv/subject/${bangumi.id}` : "",
    created_at: new Date().toISOString()
  };

  // Insert to anime table
  const columns = Object.keys(animeData).join(", ");
  const placeholders = Object.keys(animeData).map(() => "?").join(", ");
  await db.run(`INSERT INTO anime (${columns}) VALUES (${placeholders})`, Object.values(animeData));
  
  // Insert to rss_anime table
  await db.run("INSERT OR IGNORE INTO rss_anime (anime_hash, rss_id) VALUES (?, ?)", [item.hash, rssId]);
}

async function extractTitle(title) {
  // Get parse method from config
  const db = await getDb();
  const config = await db.all("SELECT key, value FROM config").then(rows => 
    rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
  );

  // AI priority
  if (config.ai_priority === "ai") {
    // Extract title by AI first
    const aiResult = await extractTitleByAI(title);
    // If no result of AI, use local parse
    if (!aiResult) {
      logger.warn(`Use Anitomy instead of AI parsing, title: ${title}`, { model: "extractTitle" });
      return extractTitleByAnitomy(title);
    }

    return aiResult;
  }

  // Local priority
  return extractTitleByAnitomy(title);
}

function extractTitleByAnitomy(title) {
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
    logger.warn(`Unable to extract title with Anitomy, title: ${title}`, { model: "extractTitleByAnitomy" });
    return null;
  }

  // Some anime has more than one titles with different language, split by "/"
  // Anitomy cannot identify whether the title is composed of one or multiple titles
  // So it's needed to extract the English title due to search engine is Anilist
  // If title is too short, slash may be part of the title, like 22/7
  if (parsed.title.includes("/") && parsed.title.length > 15) {
    return extractEnglishTitle(parsed.title);
  }

  return parsed.title;
}

function extractEnglishTitle(title) {
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

  return bestTitle;
}

export async function extractTitleByAI(title) {
  // Get AI config from config
  const db = await getDb();
  const config = await db.all("SELECT key, value FROM config").then(rows => 
    rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
  );

  // Check if AI config exists
  if (!config.ai_api || !config.ai_key || !config.ai_model) {
    logger.error(`Unable to extract title by AI due to invalid config`, { model: "extractTitleByAI" });
    return null;
  }

  // Extract title by AI
  const result = await parseByOpenAI(title, config);
  if (!result.success) {
    return null;
  }

  return result.data;
}
