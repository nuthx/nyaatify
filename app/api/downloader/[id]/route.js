import { getDb, getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a downloader 
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const db = await getDb();
    const config = await getConfig();
    const id = (await params).id;

    // Use try-catch because we need to monitor the transaction result
    await db.run("BEGIN TRANSACTION");
    try {
      // Get downloader (need name)
      const downloader = await db.get("SELECT * FROM downloader WHERE id = ?", [id]);

      // Delete downloader
      await db.run("DELETE FROM downloader WHERE id = ?", [id]);

      // Update default downloader
      // If deleted downloader is default downloader, update default downloader to the first downloader
      // If no downloader left, set default downloader to empty
      let nextDownloaderName = null;
      if (downloader.name === config.default_downloader) {
        // Find next available downloader, excluding the one being deleted
        // If no downloader left, nextDownloaderName will be null
        const nextDownloader = await db.get("SELECT name FROM downloader WHERE name != ? LIMIT 1", [downloader.name]);
        nextDownloaderName = nextDownloader?.name || "";
        await db.run("UPDATE config SET value = ? WHERE key = 'default_downloader'", [nextDownloaderName]);
      }

      // Commit transaction
      await db.run("COMMIT");

      // Log if default downloader is changed
      if (nextDownloaderName) {
        logger.info(`Default downloader changed from ${downloader.name} to ${nextDownloaderName}`, { model: "DELETE /api/downloader/[id]" });
      }
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }

    logger.info(`Downloader deleted successfully, id: ${id}`, { model: "DELETE /api/downloader/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/downloader/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
