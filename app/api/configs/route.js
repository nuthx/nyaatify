import { getDb, getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { testOpenAI } from "@/lib/api/openai";

// Get all config

export async function GET() {
  try {
    const config = await getConfig();

    return Response.json({
      code: 200,
      message: "success",
      data: config
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/configs" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Edit one or more config
// Body: {
//   config_key: config_value,
//   config_key: config_value,
//   config_key: config_value,
//   ...
// }

export async function PATCH(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if key name valid
    const existingKeys = await db.all("SELECT key FROM config");
    const validKeysSet = new Set(existingKeys.map(row => row.key));
    const invalidKeys = Object.keys(data).filter(key => !validKeysSet.has(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid key: ${invalidKeys.join(", ")}`);
    }

    // If save ai config, use a testing title to check if ai config valid
    if (data.ai_priority === "ai") {
      const result = await testOpenAI(data);
      if (!result.success) {
        throw new Error(result.message);
      }
    }

    // Use try-catch because we need to monitor the transaction result
    await db.run("BEGIN TRANSACTION");
    try {
      for (const [key, value] of Object.entries(data)) {
        await db.run("UPDATE config SET value = ? WHERE key = ?", [value, key]);
      }
      await db.run("COMMIT");
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }

    logger.info(`Saved config successfully, ${Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(", ")}`, { model: "POST /api/configs" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/configs" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
