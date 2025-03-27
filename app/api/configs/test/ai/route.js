import { sendResponse } from "@/lib/http/response";
import { useOpenAI } from "@/lib/api/openai";

// Test OpenAI API
// Body: {
//   aiKey: string, required
//   aiApi: string, required
//   aiModel: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Test OpenAI API
    const result = await useOpenAI("", "Return Hello in JSON format like: {'response': 'Hello'}", data);
    if (!result.success) {
      throw new Error(result.message);
    }

    // Parse result data to JSON
    const resultJson = JSON.parse(result.data.replace("```json", "").replace("```", ""));
    const resultData = resultJson.response;

    return sendResponse(request, {
      message: `Test AI successfully, response: ${result.data}`,
      data: { response: resultData }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
