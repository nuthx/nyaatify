import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { testOpenAI } from "@/lib/api/openai";

// Get all nyaatify config
// Method: GET

export async function GET() {
  try {
    const db = await getDb();

    const config = await db.all("SELECT key, value FROM config").then(rows => 
      rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
    );

    return Response.json({
      code: 200,
      message: "success",
      data: config
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/config" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Edit one or more config
// Method: POST
// Body: {
//   config_key: config_value,
//   config_key: config_value,
//   config_key: config_value,
//   ...
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if config key correct
    const existingKeys = await db.all("SELECT key FROM config");
    const validKeysSet = new Set(existingKeys.map(row => row.key));
    const invalidKeys = Object.keys(data).filter(key => !validKeysSet.has(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Failed to save config due to incorrect name: ${invalidKeys.join(", ")}`);
    }

    // If save ai config, use a testing title to check if ai config valid
    if (data.ai_priority === "ai") {
      const result = await testOpenAI(data);
      if (!result.success) {
        throw new Error(result.message);
      }
    }

    // Update config with transaction
    await db.run("BEGIN TRANSACTION");
    for (const [key, value] of Object.entries(data)) {
      await db.run("UPDATE config SET value = ? WHERE key = ?", [value, key]);
    }
    await db.run("COMMIT");

    logger.info(`Saved config successfully, ${Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(", ")}`, { model: "POST /api/config" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    await db.run("ROLLBACK");
    logger.error(error.message, { model: "POST /api/config" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
