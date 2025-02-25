import { logger } from "@/lib/logger";
import { refreshRSS } from "@/lib/parse";

// Refresh a rss subscription
// Body: {
//   values: {
//     name: string, required
//   }
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Refresh RSS
    refreshRSS(data.values.name);

    logger.info(`RSS subscription refreshed manually, name: ${data.values.name}`, { model: "POST /api/feeds/refresh" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/feeds/refresh" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
