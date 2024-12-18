import cron from "node-cron";
import { log } from "./log";
import { getDb } from "./db";
import { updateRss } from "./rss";

const tasks = new Map();

// Initialize RSS schedule
// Stop all existing tasks and create new tasks for each RSS
export async function rssSchedule() {
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

  // Create new tasks for each RSS
  for (const rss of rssList) {
    const task = cron.schedule(`*/${rss.interval} * * * *`, () => {
      updateRss(rss.name, rss.url);
    });
    tasks.set(rss.name, task);
  }

  // Print existing tasks
  if (tasks.size === 0) {
    log.info("No RSS schedule tasks running");
  } else {
    const taskNames = Array.from(tasks.keys()).join(", ");
    log.info(`RSS schedule is running, monitoring tasks: ${taskNames}`);
  }
}
