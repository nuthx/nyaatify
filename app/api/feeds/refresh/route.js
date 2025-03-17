import { sendResponse } from "@/lib/http/response";
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

    return sendResponse(request, {
      message: `Start refreshing RSS subscription manually, name: ${data.values.name}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
