import parser from "cron-parser";
import RSSParser from "rss-parser";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { tasks, startTask } from "@/lib/schedule";

// Get rss list with next refresh time

export async function GET() {
  try {
    const rss = await prisma.rss.findMany({
      orderBy: { name: "asc" }
    });

    // Return rss list with next refresh time
    return Response.json({
      code: 200,
      message: "success",
      data: {
        rss: rss.map(item => ({
          ...item,
          next: tasks.get(item.name)?.nextInvocation() || null
        }))
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/feeds" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new rss subscription
// Body: {
//   values: {
//     name: string, required
//     url: string, required
//     cron: string, required
//   }
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Check if name is empty
    if (!data.values.name?.trim()) {
      throw new Error("RSS name is required");
    }

    // Check if name already exists
    const existingRss = await prisma.rss.findUnique({
      where: { name: data.values.name.trim() }
    });
    
    if (existingRss) {
      throw new Error(`RSS already exists, name: ${data.values.name}`);
    }

    // Identify RSS type
    // Extract the first 20 characters of the RSS address to identify the RSS type
    let rssType = null;
    const urlPrefix = data.values.url.toLowerCase().substring(0, 20);
    if (urlPrefix.includes("nyaa")) {
      rssType = "Nyaa";
    } else if (urlPrefix.includes("mikan")) {
      rssType = "Mikan";
    } else {
      throw new Error(`Not a valid Nyaa or Mikan link: ${data.values.url}`);
    }

    // Check cron validity
    // This will throw an error if the cron is invalid
    try {
      parser.parseExpression(data.values.cron);
    } catch (error) {
      throw new Error(`Invalid cron: ${data.values.cron}, error: ${error.message}`);
    }

    // Check RSS address validity
    const rssParser = new RSSParser();
    const rss = await rssParser.parseURL(data.values.url);
    if (!rss) {
      throw new Error(`Invalid link: ${data.values.url}`);
    }

    // Insert to database
    const newRss = await prisma.rss.create({
      data: {
        name: data.values.name.trim(),
        url: data.values.url.trim(),
        cron: data.values.cron.trim(),
        type: rssType,
        state: 1,
        refreshCount: 0
      }
    });

    // Log info here because startTask will log another message
    logger.info(`Add RSS subscription successfully, name: ${data.values.name}, type: ${rssType}`, { model: "POST /api/feeds" });

    // Start RSS task
    await startTask({
      id: newRss.id,
      name: newRss.name,
      url: newRss.url,
      cron: newRss.cron,
      type: newRss.type
    });

    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/feeds" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
