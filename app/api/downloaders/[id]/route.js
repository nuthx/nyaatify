import { prisma, getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a downloader 
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const id = (await params).id;
    const config = await getConfig();

    await prisma.$transaction(async (tx) => {
      // Get the downloader name to be deleted
      const downloader = await tx.downloader.findUnique({
        where: { id: parseInt(id) }
      });

      // Delete downloader
      await tx.downloader.delete({
        where: { id: parseInt(id) }
      });

      // Update default downloader
      // If deleted downloader is default downloader, update default downloader to the first downloader
      // If no downloader left, set default downloader to empty
      if (downloader.name === config.default_downloader) {
        // Find next available downloader, excluding the one being deleted
        // If no downloader left, nextDownloaderName will be null
        const nextDownloader = await tx.downloader.findFirst({
          where: {
            NOT: {
              name: downloader.name
            }
          }
        });

        // Update default downloader config
        await tx.config.update({
          where: { key: "default_downloader" },
          data: { value: nextDownloader?.name || "" }
        });

        // Log if default downloader is changed
        if (nextDownloader) {
          logger.info(`Change default downloader from ${downloader.name} to ${nextDownloader.name}`, { model: "DELETE /api/downloaders/[id]" });
        }
      }
    });

    logger.info(`Delete downloader successfully, id: ${id}`, { model: "DELETE /api/downloaders/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/downloaders/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
