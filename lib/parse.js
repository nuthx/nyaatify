import Parser from "rss-parser";
import { parse } from "anitomy"
import { log } from "./log";
import { getDb } from "./db";
import { getBangumiId } from "./api/mikan";
import { getBangumiDetails, searchBangumiDetails } from "./api/bangumi";
import { searchAnilistDetails } from "./api/anilist";

export async function parseRSS(rssId, name, url, type) {
  const db = await getDb();
  let parser;

  const nyaaParser = new Parser({
    customFields: {
      item: [
        ["nyaa:categoryId", "category_id"],
        ["nyaa:size", "size"]
      ],
    },
  });

  const mikanParser = new Parser({
    customFields: {
      item: [
        ["link", "guid"],
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
        // Extract guid from url
        item.guid = item.guid.split("/").pop();

        // Check if the anime exists
        const existingAnime = await db.get(
          `SELECT guid FROM anime WHERE guid = ?`, 
          [item.guid]
        );

        // Parse anime details
        if (!existingAnime) {
          if (type === "Nyaa") {
            await parseNyaaAnime(db, item);
          } else if (type === "Mikan") {
            await parseMikanAnime(db, item);
          }
        }

        // Get anime id and insert to anime_rss table
        const { id } = await db.get("SELECT id FROM anime WHERE guid = ?", [item.guid]);
        await db.run(`INSERT OR IGNORE INTO anime_rss (anime_id, rss_id) VALUES (?, ?)`, [id, rssId]);
      }
      
      catch (error) {
        log.error(`Failed to insert ${item.guid} from ${name}: ${error.message}`);
      }
    }
    log.info(`Refreshed ${name} done`);
  }

  catch (error) {
    log.error(`Failed to refresh ${name}: ${error.message}`);
  }
}

async function parseNyaaAnime(db, item) {
  let name = null
  let anilist = null;
  let bangumi = null;

  if (item.category_id.startsWith("1_")) {
    name = extractTitleByAnitomy(item.title);
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
    log.warn(`Skipping parse: item ${item.guid} is not anime`);
  }

  await db.run(`
    INSERT INTO anime (
      guid, title, name_title,
      name_jp, name_cn, name_en, name_romaji,
      torrent, server_id, pub_date, size, category_id,
      cover_anilist, cover_bangumi,
      link_anilist, link_bangumi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.guid, item.title, name || "", 
    anilist?.title?.native || "", bangumi?.name_cn || "", anilist?.title?.english || "", anilist?.title?.romaji || "",
    item.link, 0, new Date(item.pubDate).toISOString(), calculateAnimeSize(item.size), item.category_id,
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
        log.warn(`Unable to get anilist details for ${item.guid}`);
      }
    } else {
      log.warn(`Unable to get bangumi details for ${item.guid}`);
    }
  } else {
    log.warn(`Unable to get bangumi ID for ${item.guid}`);
  }


  // Insert to anime table
  await db.run(`
    INSERT INTO anime (
      guid, title, name_title,
      name_jp, name_cn, name_en, name_romaji,
      torrent, server_id, pub_date, size, category_id,
      cover_anilist, cover_bangumi,
      link_anilist, link_bangumi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.guid, item.title, "",
    bangumi?.name || "", bangumi?.name_cn || "", anilist?.title?.english || "", anilist?.title?.romaji || "",
    item.enclosure.url, 0, new Date(item.torrent.pubDate).toISOString(), calculateAnimeSize(item.enclosure.length || 0), "",
    anilist?.coverImage?.extraLarge || "", bangumi?.images?.common || "",
    anilist?.id ? `https://anilist.co/anime/${anilist.id}` : "", bangumi?.id ? `https://bgm.tv/subject/${bangumi.id}` : ""
  ]);
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

function calculateAnimeSize(input) {
  if (!isNaN(input)) {
    const bytes = parseInt(input);
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  } else {
    return input
      .replace("MiB", "MB")
      .replace("GiB", "GB")
      .replace("TiB", "TB");
  }
}
