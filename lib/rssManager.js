import cron from "node-cron";
import Parser from "rss-parser";
import log from "./log";
import { getDb } from "./db";

const tasks = new Map();

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

export async function initRss() {
  const db = await getDb();
  const rssList = await db.all("SELECT * FROM rss");
  
  // Stop all existing tasks
  for (const [rssName] of tasks) {
    stopTask(rssName);
  }
  
  // Create new tasks for each RSS
  for (const rss of rssList) {
    createTask(rss);
  }

  // Print existing tasks
  const taskNames = Array.from(tasks.keys()).join(", ");
  log.info("RSS tasks: " + taskNames);
}

async function updateRss(url, rssName) {
  const db = await getDb();

  try {
    log.info("Updating: " + rssName);
    const rss = await parser.parseURL(url);
    
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
      
      catch (err) {
        log.error("Insert failed:", err);
      }
    }

    log.info("Update completed: " + rssName); 
  }
  
  catch (error) {
    log.error(`Update failed(${rssName}): ${error}`);
  }
}

export function createTask(rss) {
  // Check if the task already exists
  if (tasks.has(rss.name)) {
    stopTask(rss.name);
  }
  
  // Convert interval to cron
  const cronExpression = `*/${rss.interval} * * * *`;
  
  // Start rss update task
  const task = cron.schedule(cronExpression, () => {
    updateRss(rss.url, rss.name);
  });
  
  // Add task to map
  tasks.set(rss.name, task);
}

export function stopTask(rssName) {
  const task = tasks.get(rssName);
  if (task) {
    task.stop();
    tasks.delete(rssName);
  }
}
