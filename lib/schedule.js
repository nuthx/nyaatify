import schedule from "node-schedule";
import { log } from "./log";
import { getDb } from "./db";
import { parseRSS } from "./parse";

const tasks = new Map();

export async function startTask(rss) {
  // Stop task if same name task exists
  stopTask(rss.name);

  // Calculate next run time
  const task = schedule.scheduleJob({
    start: new Date(new Date().getTime() + rss.interval * 60 * 1000),
    rule: '*/7 * * * *'
  }, () => {
    parseRSS(rss.id, rss.name, rss.url, rss.type);
  });
  tasks.set(rss.name, task);
  
  // Run immediately
  parseRSS(rss.id, rss.name, rss.url, rss.type);
  log.info(`RSS task started: ${rss.name}`);
}

export function stopTask(rssName) {
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
