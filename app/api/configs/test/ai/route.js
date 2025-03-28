import { sendResponse } from "@/lib/http/response";
import { useOpenAI } from "@/lib/api/openai";
import { SYSTEM_PROMPT, USER_PROMPT } from "@/lib/core/extractor";

// Test OpenAI API
// Body: {
//   title: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Test OpenAI API
    const result = await useOpenAI(SYSTEM_PROMPT, `${USER_PROMPT}${data.title}`);
    if (!result.success) {
      throw new Error(result.message);
    }

    return sendResponse(request, {
      message: `Parse title successfully, input: ${data.title}, output: ${result.data}`,
      data: { output: result.data }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
