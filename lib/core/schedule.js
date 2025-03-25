import schedule from "node-schedule";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseRSS } from "@/lib/core/parser";

export const tasks = new Map();

export async function startTask(rss) {
  // Try to stop this task if it exists
  await stopTask(rss.name);

  // Set task schedule
  tasks.set(rss.name, schedule.scheduleJob(rss.cron, () => {
    parseRSS(rss.name);
  }));

  // Run parseRSS immediately
  parseRSS(rss.name);

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
  const rssList = await prisma.rss.findMany();
  for (const rss of rssList) {
    await startTask(rss);
  }
  logger.info(`Started ${rssList.length} RSS tasks`, { model: "startAllTasks" });
}

export async function stopAllTasks() {
  const rssList = await prisma.rss.findMany();
  for (const rss of rssList) {
    await stopTask(rss.name);
  }
  logger.info(`Stopped ${rssList.length} RSS tasks`, { model: "stopAllTasks" });
}
