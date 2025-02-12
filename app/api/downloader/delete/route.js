import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a downloader 
// Body: {
//   values: {
//     name: string, required
//   }
// }

export async function DELETE(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Start transaction
    await db.run("BEGIN TRANSACTION");

    // Use try-catch because we need to monitor the transaction result
    try {
      // Delete downloader
      await db.run("DELETE FROM downloader WHERE name = ?", [data.values.name]);

      // Get default downloader of config
      const config = await db.all("SELECT key, value FROM config").then(rows => 
        rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
      );

      // Update default downloader
      // If deleted downloader is default downloader, update default downloader to the first downloader
      // If no downloader left, set default downloader to empty
      let nextDownloaderName = null;
      if (data.values.name === config.default_downloader) {
        // Find next available downloader, excluding the one being deleted
        // If no downloader left, nextDownloaderName will be null
        const nextDownloader = await db.get("SELECT name FROM downloader WHERE name != ? LIMIT 1", [data.values.name]);
        nextDownloaderName = nextDownloader?.name || "";
        await db.run("UPDATE config SET value = ? WHERE key = 'default_downloader'", [nextDownloaderName]);
      }

      // Commit transaction
      await db.run("COMMIT");

      // Log if default downloader is changed
      if (nextDownloaderName) {
        logger.info(`Default downloader changed from ${data.values.name} to ${nextDownloaderName}`, { model: "DELETE /api/downloader/delete" });
      }

      logger.info(`Downloader deleted successfully, name: ${data.values.name}`, { model: "DELETE /api/downloader/delete" });
      return Response.json({
        code: 200,
        message: "success",
        data: null
      });
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/downloader/delete" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
