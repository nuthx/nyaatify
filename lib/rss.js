import Parser from "rss-parser";
import { parse } from "anitomy"
import { log } from "./log";
import { getDb } from "./db";

export async function refreshRSS(rssId, name, url, type) {
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
        ["torrent", "torrent"]
      ],
    },
  });

  // Use specific parser for Nyaa only
  // Unable to parse unknown RSS subscription
  if (type === "Nyaa") {
    parser = nyaaParser;
  } else if (type === "Mikan") {
    parser = mikanParser;
  } else {
    log.error(`${name}, ${type} | Unable to parse unknown RSS subscription`);
    return;
  }

  try {
    log.info(`${name} | RSS subscription is refreshing...`);
    const rss = await parser.parseURL(url);

    for (const item of rss.items) {
      // Extract guid from url
      if (type === "Nyaa") {
        item.guid = item.guid.split("/").pop();
      } else if (type === "Mikan") {
        item.guid = item.link.split("/").pop();
      }

      // Check if the anime exists
      const existingAnime = await db.get(
        `SELECT guid FROM anime WHERE guid = ?`, 
        [item.guid]
      );

      try {
        let animeId;
        if (!existingAnime) {
          // Extract anime name from title
          item.title = item.title
            .replace("BD", "")
            .replace("BD-BOX", "")
            .replace("DVD", "")
            .replace("DVD-BOX", "")
            .replace("- TV", "")
            .replace("+ OAD", "")
          const parsed = parse(item.title);
          item.name = parsed.title;
          if (parsed.title) {
            log.info(`${name}, ${type} | Parsed ${item.title} ==> ${item.name}`);
          } else {
            log.error(`${name}, ${type} | Failed to parse ${item.title}`);
          }

          // Search anime name from anilist
          // TODO: Use anilist api to search anime name

          // Search cover image from anilist
          // TODO: Use anilist api to search cover image

          // Calculate anime size
          if (type === "Nyaa") {
            item.size = item.size.replace("MiB", "MB").replace("GiB", "GB").replace("TiB", "TB");
          } else if (type === "Mikan") {
            const bytes = parseInt(item.enclosure.length || 0);
            if (bytes === 0) {
              item.size = "0 MB";
            } else {
              const sizes = ["B", "KB", "MB", "GB", "TB"];
              const i = Math.floor(Math.log(bytes) / Math.log(1024));
              item.size = `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
            }
          }

          // Insert to anime table
          if (type === "Nyaa") {
            await db.run(`
              INSERT INTO anime (
                guid, title, name, name_jp_anilist, cover_anilist, torrent, server_id,
                pub_date, size, category_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.guid, item.title, item.name, "", "", item.link, 0,
              new Date(item.pubDate).toISOString(), item.size, item.category_id
            ]);
          } else if (type === "Mikan") {
            await db.run(`
              INSERT INTO anime (
                guid, title, name, name_jp_anilist, cover_anilist, torrent, server_id,
                pub_date, size, category_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.guid, item.title, item.name, "", "", item.enclosure.url, 0,
              new Date(item.torrent.pubDate).toISOString(), item.size, ""
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
        log.info(`${name}, ${type} | A new anime added: ${item.name}`);
      } catch (error) {
        log.error(`${name}, ${type} | Failed to insert ${item.name}: ${error}`);
      }
    }
    log.info(`${name}, ${type} | RSS subscription refreshed done`);
  }

  catch (error) {
    log.error(`${name}, ${type} | Failed to refresh RSS subscription: ${error}`);
  }
}
