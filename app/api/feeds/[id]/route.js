import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stopTask } from "@/lib/schedule";

// Delete a rss subscription
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const id = (await params).id;

    // Check if RSS is running
    const rss = await prisma.rss.findUnique({
      where: { id }
    });
    
    if (rss.state === 0) {
      throw new Error(`RSS subscription is refreshing, deletion not possible, id: ${id}`);
    }

    // Stop RSS task
    await stopTask(rss.name);

    await prisma.$transaction(async (tx) => {
      // Find isolated anime records
      const isolatedAnimes = await tx.rss.findUnique({
        where: { id },
        select: {
          animes: {
            where: {
              rss: {
                none: {
                  id: { not: id }
                }
              }
            }
          }
        }
      });

      // Delete isolated anime records
      if (isolatedAnimes?.animes.length) {
        await tx.anime.deleteMany({
          where: {
            id: {
              in: isolatedAnimes.animes.map(a => a.id)
            }
          }
        });
      }

      // Delete RSS record
      await tx.rss.delete({
        where: { id }
      });
    });

    logger.info(`Delete RSS subscription successfully, id: ${id}`, { model: "DELETE /api/feeds/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/feeds/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
