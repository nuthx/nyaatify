import cron from "node-cron";
import { log } from "./log";
import { getDb } from "./db";
import { parseRSS } from "./parse";

const tasks = new Map();

// Initialize RSS schedule
// Stop all existing tasks and create new tasks for each RSS
export async function refreshRSS() {
  const db = await getDb();
  const rssList = await db.all("SELECT * FROM rss");

  // Stop all existing tasks
  for (const [rssName] of tasks) {
    const task = tasks.get(rssName);
    if (task) {
      task.stop();
      tasks.delete(rssName);
    }
  }

  // Create new tasks for each RSS and run immediately
  for (const rss of rssList) {
    const task = cron.schedule(`*/${rss.interval} * * * *`, () => {
      parseRSS(rss.id, rss.name, rss.url, rss.type);
    });
    tasks.set(rss.name, task);
    
    // Run immediately
    parseRSS(rss.id, rss.name, rss.url, rss.type);
  }

  // Print existing tasks
  if (tasks.size === 0) {
    log.info("No RSS subscription tasks are running");
  } else {
    const taskNames = Array.from(tasks.keys()).join(", ");
    log.info(`${rssList.length} RSS subscription tasks are running: ${taskNames}`);
  }
}
