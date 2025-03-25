import schedule from "node-schedule";
import RSSParser from "rss-parser";
import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";
import { parserConfig } from "@/lib/core/parser/config";
import { tasks, startTask } from "@/lib/core/schedule";

// Get rss list with next refresh time

export async function GET(request) {
  try {
    const rss = await prisma.rss.findMany({
      orderBy: { name: "asc" }
    });

    // Return rss list with next refresh time
    return sendResponse(request, {
      data: {
        rss: rss.map(item => ({
          ...item,
          next: tasks.get(item.name)?.nextInvocation() || null
        }))
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Add a new rss subscription
// Body: {
//   name: string, required
//   url: string, required
//   cron: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Check if name is empty
    if (!data.name) {
      throw new Error("RSS name is required");
    }

    // Check if name already exists
    const existingRss = await prisma.rss.findUnique({
      where: { name: data.name }
    });
    if (existingRss) {
      throw new Error(`RSS already exists, name: ${data.name}`);
    }

    // Identify RSS type
    const hostname = new URL(data.url).hostname.toLowerCase();
    const matchedConfig = parserConfig.find(config => config.urls.some(url => hostname.includes(url)));
    if (!matchedConfig) {
      throw new Error(`Unsupported RSS feed: ${data.url}`);
    }
    const rssType = matchedConfig.type;

    // Check cron validity
    // Create a new scheduler instance and cancel it immediately to validate the cron
    // If the cron is invalid, it will throw an error
    try {
      const job = schedule.scheduleJob(data.cron, () => {});
      job.cancel();
    } catch (error) {
      throw new Error(`Invalid cron: ${data.cron}, error: ${error.message}`);
    }

    // Check RSS address validity
    const rssParser = new RSSParser();
    const rss = await rssParser.parseURL(data.url);
    if (!rss) {
      throw new Error(`Invalid RSS feed: ${data.url}`);
    }

    // Insert to database
    const newRss = await prisma.rss.create({
      data: {
        name: data.name,
        url: data.url,
        cron: data.cron,
        type: rssType,
        state: 1,
        refreshCount: 0
      }
    });

    // Start RSS task
    await startTask({
      id: newRss.id,
      name: newRss.name,
      url: newRss.url,
      cron: newRss.cron,
      type: newRss.type
    });

    return sendResponse(request, {
      message: `Add RSS subscription successfully, name: ${data.name}, type: ${rssType}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
