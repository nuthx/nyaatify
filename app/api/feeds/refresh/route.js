import { sendResponse } from "@/lib/http/response";
import { refreshRSS } from "@/lib/core/refresh";

// Refresh a rss subscription
// Body: {
//   name: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Refresh RSS
    refreshRSS(data.name);

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
