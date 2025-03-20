import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";
import { stopTask } from "@/lib/schedule";

// Delete a rss subscription
// Params: id, string, required

export async function DELETE(request, { params }) {
  try {
    const id = parseInt((await params).id);

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

    return sendResponse(request, {
      message: `Delete RSS subscription successfully, id: ${id}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
