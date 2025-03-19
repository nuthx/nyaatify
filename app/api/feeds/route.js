import parser from "cron-parser";
import RSSParser from "rss-parser";
import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";
import { tasks, startTask } from "@/lib/schedule";

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
    if (!data.name?.trim()) {
      throw new Error("RSS name is required");
    }

    // Check if name already exists
    const existingRss = await prisma.rss.findUnique({
      where: { name: data.name.trim() }
    });
    
    if (existingRss) {
      throw new Error(`RSS already exists, name: ${data.name}`);
    }

    // Identify RSS type
    // Extract the first 20 characters of the RSS address to identify the RSS type
    let rssType = null;
    const urlPrefix = data.url.toLowerCase().substring(0, 20);
    if (urlPrefix.includes("nyaa")) {
      rssType = "Nyaa";
    } else if (urlPrefix.includes("mikan")) {
      rssType = "Mikan";
    } else {
      throw new Error(`Not a valid Nyaa or Mikan link: ${data.url}`);
    }

    // Check cron validity
    // This will throw an error if the cron is invalid
    try {
      parser.parseExpression(data.cron);
    } catch (error) {
      throw new Error(`Invalid cron: ${data.cron}, error: ${error.message}`);
    }

    // Check RSS address validity
    const rssParser = new RSSParser();
    const rss = await rssParser.parseURL(data.url);
    if (!rss) {
      throw new Error(`Invalid link: ${data.url}`);
    }

    // Insert to database
    const newRss = await prisma.rss.create({
      data: {
        name: data.name.trim(),
        url: data.url.trim(),
        cron: data.cron.trim(),
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
