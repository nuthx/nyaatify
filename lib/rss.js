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

export async function updateRss(rssId, name, url) {
  const db = await getDb();

  try {
    // Get RSS content
    const rss = await parser.parseURL(url);
    log.info(`${name} | RSS is updating...`);
    
    // Insert each RSS item to database
    for (const item of rss.items) {
      try {
        // Extract guid from url    
        item.guid = item.guid.split("/").pop();

        // Fix date format
        item.pubDate = new Date(item.pubDate).toISOString();

        // Add related rss
        item.related = rssId;

        await db.run(`
          INSERT OR IGNORE INTO anime (
            guid, title, name_en, name_jp, torrent, download, related, date,
            size, hash, seeders, leechers, completed,
            comments, category, categoryId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.guid, item.title, "", "", item.link, 0, "", item.pubDate,
          item.size, item.hash, item.seeders, item.leechers, item.downloads,
          item.comments, item.category, item.categoryId
        ]);
      }
      
      catch (error) {
        log.error(`${name} | ${rss.items} | Insert to database failed: ${error}`);
      }
    }

    log.info(`${name} | RSS update completed`); 
  }

  catch (error) {
    log.error(`${name} | RSS update failed: ${error}`);
  }
}
