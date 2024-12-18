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

export async function updateRss(name, url) {
  const db = await getDb();

  try {
    // Get RSS content
    const rss = await parser.parseURL(url);
    log.info(`${name} | RSS is updating...`);
    
    // Insert each RSS item to database
    for (const item of rss.items) {
      try {
        await db.run(`
          INSERT OR IGNORE INTO anime (
            guid, title, torrent, download, related, date, size,
            category, categoryId, seeders, leechers, completed,
            comments, hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.guid, item.title, item.link, 0, item.link, item.pubDate, item.size,
          item.category, item.categoryId, item.seeders, item.leechers, item.downloads,
          item.comments, item.hash
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
