import { prisma, getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendResponse } from "@/lib/http/response";

// Delete a downloader 
// Params: id, string, required

export async function DELETE(request, { params }) {
  try {
    const id = parseInt((await params).id);
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
      if (downloader.name === config.defaultDownloader) {
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
          where: { key: "defaultDownloader" },
          data: { value: nextDownloader?.name || "" }
        });

        // Log if default downloader is changed
        if (nextDownloader) {
          logger.info(`Change default downloader from ${downloader.name} to ${nextDownloader.name}`, { model: "DELETE /api/downloaders/[id]" });
        }
      }
    });

    return sendResponse(request, {
      message: `Delete downloader successfully, id: ${id}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
