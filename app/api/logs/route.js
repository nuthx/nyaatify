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

    // Check if logContent exists and is not empty
    // Use logContent.trim() to make sure log file is not empty
    if (logContent && logContent.trim()) {
      return Response.json({
        logs: logContent.trim().split("\n").map(line => JSON.parse(line)).reverse(),
        days: availableDays,
        date: foundDate
      });
    } else {
      logger.warn(`No system logs found for date: ${targetDateStr}`, { model: "GET /api/logs" });
      return Response.json({
        logs: [],
        days: availableDays,
        date: targetDateStr
      });
    }
  } catch (error) {
    logger.error(error.message, { model: "GET /api/logs" });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
