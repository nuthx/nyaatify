import { format } from "date-fns";
import { readFile, readdir } from "fs/promises";
import { logger } from "@/lib/logger";

// Get system logs
// Method: GET
// Params: date, string, optional, default: today

export async function GET(request) {
  try {
    const targetDate = new Date(request.nextUrl.searchParams.get("date") || new Date());
    const targetDateStr = format(targetDate, "yyyy-MM-dd");

    // Get all log files
    const files = await readdir("logs");
    const logFiles = files.filter(f => f.endsWith("-combined.log"));
    
    // Get available dates
    const availableDays = logFiles.map(f => f.split("-combined.log")[0]);

    // Sort log files by date descending
    const sortedFiles = logFiles.sort((a, b) => b.localeCompare(a));
    
    // Find the first available log file that's not after target date
    let logContent = null;
    let foundDate = null;
    for (const file of sortedFiles) {
      const fileDate = file.split("-combined.log")[0];
      if (fileDate <= targetDateStr) {
        try {
          logContent = await readFile(`logs/${file}`, "utf-8");
          foundDate = fileDate;
          break;
        } catch (e) {
          continue;
        }
      }
    }

    const logs = logContent.trim().split("\n").map(line => JSON.parse(line)).reverse();
    if (logs) {
      logger.info(`Fetched system logs successfully, date: ${foundDate} count: ${logs.length}`, { model: "GET /api/logs" });
      return Response.json({
        logs: logs,
        days: availableDays,
        date: foundDate
      });
    } else {
      logger.info(`No system logs found for date: ${foundDate}`, { model: "GET /api/logs" });
      return Response.json({
        logs: [],
        days: availableDays,
        date: "1970-01-01"
      });
    }
  } catch (error) {
    logger.error(error.message, { model: "GET /api/logs" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
