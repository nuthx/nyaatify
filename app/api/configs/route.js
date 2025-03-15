import { prisma, getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { testOpenAI } from "@/lib/api/openai";

// Get all config

export async function GET() {
  try {
    const config = await getConfig();

    // Hide aiKey with first 15 characters and asterisks
    if (config.aiKey) {
      config.aiKey = config.aiKey.slice(0, 15) + "*".repeat(Math.max(0, config.aiKey.length - 15));
    }

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
    const data = await request.json();

    // Check if key name valid
    const existingKeys = await prisma.config.findMany();
    const validKeysSet = new Set(existingKeys.map(row => row.key));
    const invalidKeys = Object.keys(data).filter(key => !validKeysSet.has(key));
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid key: ${invalidKeys.join(", ")}`);
    }

    // If save ai config, parse a anime title to verify validity
    if (data.aiPriority === "ai") {
      const result = await testOpenAI(data);
      if (!result.success) {
        throw new Error(result.message);
      }
    }

    // Update configs using Prisma transaction
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.config.update({
          where: { key },
          data: { value }
        })
      )
    );

    logger.info(`Saved config successfully, ${Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(", ")}`, { model: "PATCH /api/configs" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/configs" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
