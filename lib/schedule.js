import schedule from "node-schedule";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseRSS } from "@/lib/parse";

export const tasks = new Map();

export async function startTask(rss) {
  // Try to stop this task if it exists
  await stopTask(rss.name);

  // Set task schedule
  tasks.set(rss.name, schedule.scheduleJob(rss.cron, () => {
    parseRSS(rss.id, rss.name, rss.url, rss.type);
  }));

  // Run parseRSS immediately
  parseRSS(rss.id, rss.name, rss.url, rss.type);

  logger.info(`RSS task started successfully, name: ${rss.name}, cron: ${rss.cron}`, { model: "startTask" });
}

export async function stopTask(rssName) {
  const task = tasks.get(rssName);
  if (task) {
    task.cancel();
    tasks.delete(rssName);
    logger.info(`RSS task stopped successfully, name: ${rssName}`, { model: "stopTask" });
  }
}

export async function startAllTasks() {
  const db = await getDb();
  const rssList = await db.all("SELECT * FROM rss");

  for (const rss of rssList) {
    await startTask(rss);
  }
}

export async function stopAllTasks() {
  const db = await getDb();
  const rssList = await db.all("SELECT * FROM rss");

  for (const rss of rssList) {
    await stopTask(rss.name);
  }
}
