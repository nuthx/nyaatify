import { prisma, getConfig } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Get all config

export async function GET(request) {
  try {
    const config = await getConfig();

    // Hide aiKey with first 15 characters and asterisks
    if (config.aiKey) {
      config.aiKey = config.aiKey.slice(0, 15) + "*".repeat(Math.max(0, config.aiKey.length - 15));
    }

    return sendResponse(request, {
      data: config
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
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

    // Update configs using Prisma transaction
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.config.update({
          where: { key },
          data: { value }
        })
      )
    );

    return sendResponse(request, {
      message: `Saved config successfully, ${Object.entries(data).map(([key, value]) => `${key}: ${value}`).join(", ")}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
