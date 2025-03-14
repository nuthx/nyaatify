import { format } from "date-fns";
import { readFile, readdir } from "fs/promises";
import { logger } from "@/lib/logger";

// Get system logs
// Params: date, string, optional, default: today, format: 2025-01-01

export async function GET(request) {
  try {
    const targetDate = new Date(request.nextUrl.searchParams.get("date") || new Date());
    const targetDateStr = format(targetDate, "yyyy-MM-dd");

    // Get all log files
    const files = await readdir("data/logs");
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
          logContent = await readFile(`data/logs/${file}`, "utf-8");
          foundDate = fileDate;
          break;
        } catch (e) {
          continue;
        }
      }
    }

    // Check if log file exists
    if (foundDate) {
      return Response.json({
        code: 200,
        message: "success",
        data: {
          logs: logContent ? logContent.trim().split("\n").map(line => JSON.parse(line)).reverse() : [],
          days: availableDays,
          date: foundDate
        }
      });
    } else {
      logger.warn(`No system logs found, date: ${targetDateStr}`, { model: "GET /api/logs" });
      return Response.json({
        code: 404,
        message: "No system logs found",
        data: {
          logs: [],
          days: availableDays,
          date: targetDateStr
        }
      });
    }
  } catch (error) {
    logger.error(error.message, { model: "GET /api/logs" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
