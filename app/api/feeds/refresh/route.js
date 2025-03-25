import { sendResponse } from "@/lib/http/response";
import { parseRSS } from "@/lib/core/parser";

// Refresh a rss subscription
// Body: {
//   name: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Refresh RSS
    parseRSS(data.name);

    return sendResponse(request, {
      message: `Start refreshing RSS subscription manually, name: ${data.name}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
