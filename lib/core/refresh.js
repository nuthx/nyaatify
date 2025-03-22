import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseRSS } from "@/lib/core/parser/main";

export async function refreshRSS(RSSName) {
  try {
    logger.info(`Start refreshing, rss: ${RSSName}`, { model: "refreshRSS" });

    // Get RSS data from database
    const rss = await prisma.rss.findUnique({
      where: { name: RSSName }
    });

    // Set RSS state to running in database before parsing
    await prisma.rss.update({
      where: { name: RSSName },
      data: { state: 0 }
    });

    // Parse the RSS using main parser
    const success = await parseRSS(rss);
    if (!success) {
      throw new Error("Failed to parse RSS");
    }

    // Set state to completed, update refresh time, and increase refresh count
    await prisma.rss.update({
      where: { name: RSSName },
      data: {
        state: 1,
        refreshedAt: new Date(),
        refreshCount: { increment: 1 }
      }
    });
    logger.info(`Refresh completed, rss: ${RSSName}`, { model: "refreshRSS" });
  } catch (error) {
    // Set state and refresh time even if error occurs, but don't increase refresh count
    await prisma.rss.update({
      where: { name: RSSName },
      data: {
        state: 1,
        refreshedAt: new Date()
      }
    });
  }
}
