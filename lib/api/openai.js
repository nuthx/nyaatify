import OpenAI from "openai";
import { getConfig } from "@/lib/db";

/**
 * Uses OpenAI API to generate a response based on system and user content
 * @param {string} systemContent - The system message to set context for the AI
 * @param {string} userContent - The user's message to the AI
 * @param {Object} [testConfig] - Optional configuration for testing only
 * @param {string} [testConfig.aiKey] - Optional API key for testing
 * @param {string} [testConfig.aiApi] - Optional API endpoint URL for testing
 * @param {string} [testConfig.aiModel] - Optional model name for testing
 * @returns {Object} Response object with success status, message, and data
 */
export async function useOpenAI(systemContent, userContent, testConfig) {
  try {
    const config = await getConfig();

    const openai = new OpenAI({
      apiKey: testConfig?.aiKey || config.aiKey || "",
      baseURL: testConfig?.aiApi.replace("/chat/completions", "") || config.aiApi.replace("/chat/completions", "") || "",
    });

    const completion = await openai.chat.completions.create({
      model: testConfig?.aiModel || config.aiModel || "",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ],
      temperature: 1,
      response_format: { type: "json_object" }
    });

    return {
      success: true,
      message: "success",
      data: completion.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
