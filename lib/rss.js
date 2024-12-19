import Parser from "rss-parser";
import { log } from "./log";
import { getDb } from "./db";

// Add Nyaa custom fields to the RSS parser
const parser = new Parser({
  customFields: {
    item: [
      ["nyaa:size", "size"],
      ["nyaa:category", "category"], 
      ["nyaa:categoryId", "categoryId"],
      ["nyaa:seeders", "seeders"],
      ["nyaa:leechers", "leechers"],
      ["nyaa:downloads", "completed"],
      ["nyaa:infoHash", "hash"],
      ["nyaa:comments", "comments"]
    ],
  },
});

export async function updateRSS(rssId, name, url) {
  const db = await getDb();

  try {
    // Get RSS content
    const rss = await parser.parseURL(url);
    log.info(`${name} | RSS subscription is updating...`);
    
    // Insert each RSS item to database
    for (const item of rss.items) {
      try {
        // Extract guid from url
        item.guid = item.guid.split("/").pop();

        // Check if the anime exists
        const existingAnime = await db.get(
          `SELECT guid FROM anime WHERE guid = ?`, 
          [item.guid]
        );

        // Insert anime if not exists
        if (!existingAnime) {
          await db.run(`
            INSERT INTO anime (
              guid, title, name_en, name_jp, torrent, download, date,
              size, hash, seeders, leechers, completed,
              comments, category, categoryId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.guid, item.title, "", "", item.link, 0, new Date(item.pubDate).toISOString(),
            item.size, item.hash, item.seeders, item.leechers, item.downloads,
            item.comments, item.category, item.categoryId
          ]);
        }

        // Insert anime_rss if not exists
        await db.run(`
          INSERT OR IGNORE INTO anime_rss (anime_id, rss_id) VALUES (?, ?)
        `, [item.guid, rssId]);
      }

      catch (error) {
        log.error(`${name} | Failed to insert ${rss.guid}: ${error}`);
      }
    }

    log.info(`${name} | RSS subscription updated successfully`); 
  }

  catch (error) {
    log.error(`${name} | Failed to update RSS subscription: ${error}`);
  }
}
