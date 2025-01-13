import schedule from "node-schedule";
import { log } from "@/lib/log";
import { getDb } from "@/lib/db";
import { parseRSS } from "@/lib/parse";

export const tasks = new Map();

export async function startTask(rss) {
  // Stop task if same name task exists
  await stopTask(rss.name);

  // Set task schedule
  const task = schedule.scheduleJob(rss.cron, () => {
    parseRSS(rss.id, rss.name, rss.url, rss.type);
  });
  tasks.set(rss.name, task);

  // Run immediately
  parseRSS(rss.id, rss.name, rss.url, rss.type);
  log.info(`RSS task started: ${rss.name}`);
}

export async function stopTask(rssName) {
  const task = tasks.get(rssName);
  if (task) {
    task.cancel();
    tasks.delete(rssName);
    log.info(`RSS task stopped: ${rssName}`);
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
