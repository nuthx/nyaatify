import Parser from "rss-parser";
import { parse } from "anitomy"
import { log } from "@/lib/log";
import { getDb } from "@/lib/db";
import { formatBytes } from "@/lib/bytes";
import { parseByOpenAI } from "@/lib/api/openai";
import { searchAnilistDetails } from "@/lib/api/anilist";
import { getBangumiDetails, searchBangumiDetails } from "@/lib/api/bangumi";
import { getBangumiId } from "@/lib/api/mikan";

export async function parseRSS(rssId, name, url, type) {
  const db = await getDb();
  let parser;

  // Set state to running in database
  await db.run("UPDATE rss SET state = 'running' WHERE id = ?", [rssId]);

  const nyaaParser = new Parser({
    customFields: {
      item: [
        ["nyaa:infoHash", "hash"],
        ["nyaa:categoryId", "category_id"],
        ["nyaa:size", "size"]
      ],
    },
  });

  const mikanParser = new Parser({
    customFields: {
      item: [
        ["torrent", "torrent"]
      ],
    },
  });

  try {
    if (type === "Nyaa") {
      parser = nyaaParser;
    } else if (type === "Mikan") {
      parser = mikanParser;
    } else {
      throw new Error(`Unable to parse RSS subscription with unknown type`);
    }

    log.info(`Refreshing ${name}...`);
    const rss = await parser.parseURL(url);

    for (const item of rss.items) {
      try {
        // Extract hash from url
        if (type === "Mikan") {
          item.hash = item.link.split("/").pop();
        }

        // Check if the anime exists
        const existingAnime = await db.get("SELECT hash FROM anime WHERE hash = ?", [item.hash]);

        // Parse anime details
        if (!existingAnime) {
          if (type === "Nyaa") {
            await parseNyaaAnime(db, item);
          } else if (type === "Mikan") {
            await parseMikanAnime(db, item);
          }
        }

        // Insert to rss_anime table
        await db.run("INSERT OR IGNORE INTO rss_anime (anime_hash, rss_id) VALUES (?, ?)", [item.hash, rssId]);
      }
      
      catch (error) {
        log.error(`Failed to insert ${item.hash} from ${name}: ${error.message}`);
      }
    }

    // Set state to completed and update last_refreshed_at in database
    await db.run(
      "UPDATE rss SET state = 'completed', last_refreshed_at = ? WHERE id = ?",
      [new Date().toISOString(), rssId]
    );
    log.info(`Refreshed ${name} done`);
  }

  catch (error) {
    // Set state to completed and update last_refreshed_at in database even if error occurs
    await db.run(
      "UPDATE rss SET state = 'completed', last_refreshed_at = ? WHERE id = ?",
      [new Date().toISOString(), rssId]
    );
    log.error(`Failed to refresh ${name}: ${error.message}`);
  }
}

async function parseNyaaAnime(db, item) {
  let name = null
  let anilist = null;
  let bangumi = null;

  if (item.category_id.startsWith("1_")) {
    name = await extractTitle(item.title);
    if(name) {
      anilist = await searchAnilistDetails(name);
      if (anilist?.title?.native) {
        bangumi = await searchBangumiDetails(anilist.title.native);
        if (!bangumi) {
          log.warn(`Unable to obtain search results for ${name} from bangumi`);
        }
      } else {
        log.warn(`Unable to obtain search results for ${name} from anilist`);
      }
    } else {
      log.warn(`Unable to extract title from ${item.title}`);
    }
  } else {
    log.warn(`Skipping parse: item ${item.hash} is not anime`);
  }

  await db.run(`
    INSERT INTO anime (
      hash, title, name_title,
      name_jp, name_cn, name_en, name_romaji,
      torrent, pub_date, size, category_id,
      cover_anilist, cover_bangumi,
      link_anilist, link_bangumi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.hash, item.title, name || "", 
    anilist?.title?.native || "", bangumi?.name_cn || "", anilist?.title?.english || "", anilist?.title?.romaji || "",
    item.link, new Date(item.pubDate).toISOString(), item.size, item.category_id,
    anilist?.coverImage?.extraLarge || "", bangumi?.images?.common || "",
    anilist?.id ? `https://anilist.co/anime/${anilist.id}` : "", bangumi?.id ? `https://bgm.tv/subject/${bangumi.id}` : ""
  ]);
}

async function parseMikanAnime(db, item) {
  const bangumiId = await getBangumiId(item.torrent.link[0]);
  let bangumi = null;
  let anilist = null;

  if (bangumiId) {
    bangumi = await getBangumiDetails(bangumiId);
    if (bangumi) {
      anilist = await searchAnilistDetails(bangumi.name);
      if (!anilist) {
        log.warn(`Unable to get anilist details for ${item.hash}`);
      }
    } else {
      log.warn(`Unable to get bangumi details for ${item.hash}`);
    }
  } else {
    log.warn(`Unable to get bangumi ID for ${item.hash}`);
  }


  // Insert to anime table
  await db.run(`
    INSERT INTO anime (
      hash, title, name_title,
      name_jp, name_cn, name_en, name_romaji,
      torrent, pub_date, size, category_id,
      cover_anilist, cover_bangumi,
      link_anilist, link_bangumi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.hash, item.title, "",
    bangumi?.name || "", bangumi?.name_cn || "", anilist?.title?.english || "", anilist?.title?.romaji || "",
    item.enclosure.url, new Date(item.torrent.pubDate).toISOString(), formatBytes(item.enclosure.length || 0), "",
    anilist?.coverImage?.extraLarge || "", bangumi?.images?.common || "",
    anilist?.id ? `https://anilist.co/anime/${anilist.id}` : "", bangumi?.id ? `https://bgm.tv/subject/${bangumi.id}` : ""
  ]);
}

async function extractTitle(title) {
  const db = await getDb();
  const config = await db.get("SELECT * FROM config WHERE id = 1");

  if (config.ai_priority === "local") {
    return extractTitleByAnitomy(title);
  } else if (config.ai_priority === "ai") {
    // Extract title by AI first
    const aiResult = await extractTitleByAI(title);
    if (aiResult === null) {
      return extractTitleByAnitomy(title);
    } else {
      return aiResult;
    }
  } else {
    return null;
  }
}

function extractTitleByAnitomy(title) {
  const cleanedTitle = title
    .replace("BD-BOX", "")
    .replace("BD", "")
    .replace("DVD-BOX", "")
    .replace("DVD", "")
    .replace("- TV", "")
    .replace("+ OAD", "");

  const parsed = parse(cleanedTitle);
  if (!parsed || !parsed.title) {
    return null;
  } else {
    if (parsed.title.includes("/")) {
      return extractEnglishTitle(parsed.title);
    } else {
      return parsed.title;
    }
  }
}

function extractEnglishTitle(title) {
  // Some anime has more than one titles with different language
  // Anitomy cannot identify whether the title is composed of one or multiple titles
  // So it's needed to extract the English title due to search engine is Anilist
  // If title is too short, slash may be part of the title, like 22/7
  if (title.length <= 15) {
    return title;
  }

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
  const db = await getDb();

  // Check if AI config valid
  const config = await db.get("SELECT * FROM config WHERE id = 1");
  if (!config.ai_api || !config.ai_key || !config.ai_model) {
    log.error("Not a valid AI config");
    return null;
  }

  return await parseByOpenAI(title, config);
}
