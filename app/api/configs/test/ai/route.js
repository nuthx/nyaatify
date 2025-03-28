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

    // Test OpenAI API with streaming
    const result = await useOpenAI(SYSTEM_PROMPT, `${USER_PROMPT}${data.title}`, null, true);
    if (!result.success) {
      throw new Error(result.message);
    }

    // Create a new ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";
          for await (const chunk of result.stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;
            controller.enqueue(content);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
