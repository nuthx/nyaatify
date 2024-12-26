import Parser from "rss-parser";
import { parse } from "anitomy"
import { log } from "./log";
import { getDb } from "./db";
import { getBangumiId } from "./api/mikan";
import { getBangumiDetails } from "./api/bangumi";
import { getAnilistDetails } from "./api/anilist";

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

    log.info(`Refreshing ${type} ${name}...`);
    const rss = await parser.parseURL(url);

    for (const item of rss.items) {
      try {
        let animeId;

        // Extract guid from url
        item.guid = item.guid.split("/").pop();

        // Check if the anime exists
        const existingAnime = await db.get(
          `SELECT guid FROM anime WHERE guid = ?`, 
          [item.guid]
        );
        
        if (!existingAnime) {
          // Analyze anime name
          if (type === "Nyaa") {
            // Parse anime name from title
            item.title = item.title
              .replace("BD-BOX", "")  
              .replace("BD", "")
              .replace("DVD-BOX", "")
              .replace("DVD", "")
              .replace("- TV", "")
              .replace("+ OAD", "")
            const parsed = parse(item.title);
            item.name = parsed.title;

            // Get details from Anilist
            const anilist = await getAnilistDetails(item.name);

            if (!anilist) {
              throw new Error(`anilist error | ${item.name} | No results found`);
            }

            // Calculate anime size
            item.size = item.size.replace("MiB", "MB").replace("GiB", "GB").replace("TiB", "TB");

            // Insert to anime table
            await db.run(`
              INSERT INTO anime (
                guid, title, name_title, name_jp, name_cn, name_en, cover,
                torrent, server_id, pub_date, size, category_id, anilist_link
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.guid, item.title, item.name, anilist.title.native || "", "", anilist.title.romaji || "", anilist.coverImage.extraLarge || "",
              item.link, 0, new Date(item.pubDate).toISOString(), item.size, item.category_id, `https://anilist.co/anime/${anilist.id}`
            ]);
          } 
          
          else if (type === "Mikan") {
            // Get bangumi ID
            const bgmId = await getBangumiId(item.torrent.link[0]);

            // Get details from Bangumi
            const bgm = await getBangumiDetails(bgmId);

            // Calculate anime size
            const bytes = parseInt(item.enclosure.length || 0);
            const sizes = ["B", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            item.size = `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;

            // Insert to anime table
            await db.run(`
              INSERT INTO anime (
                guid, title, name_title, name_jp, name_cn, name_en, cover,
                torrent, server_id, pub_date, size, bangumi_link
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.guid, item.title, "", bgm.name, bgm.name_cn, "", bgm.images.common,
              item.enclosure.url, 0, new Date(item.torrent.pubDate).toISOString(), item.size, `https://bgm.tv/subject/${bgmId}`
            ]);
          }

          // Get the last inserted ID
          const result = await db.get("SELECT last_insert_rowid() as id");
          animeId = result.id;
        } else {
          // Get anime id from guid
          const result = await db.get("SELECT id FROM anime WHERE guid = ?", [item.guid]);
          animeId = result.id;
        }

        // Insert to anime_rss table
        await db.run(`INSERT OR IGNORE INTO anime_rss (anime_id, rss_id) VALUES (?, ?)`, [animeId, rssId]);
      } catch (error) {
        log.error(`${name}, ${type} | Failed to insert ${item.guid}: ${error.message}`);
      }
    }
    log.info(`Refreshed ${type} ${name}`);
  }

  catch (error) {
    log.error(`Failed to refresh ${name}: ${error.message}`);
  }
}
