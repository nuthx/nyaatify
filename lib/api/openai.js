import OpenAI from "openai";
import { logger } from "@/lib/logger";

export async function testOpenAI(config) {
  try {
    const openai = new OpenAI({
      apiKey: config.ai_key,
      baseURL: config.ai_api,
    });
    const completion = await openai.chat.completions.create({
      model: config.ai_model,
      messages: [ { role: "user", content: "Hello" } ]
    });

    // Some AI will return error message when some error occurs
    if (completion.choices[0].message.content.includes("error")) {
      throw new Error(completion.choices[0].message.content);
    }

    logger.info(`Test AI server successfully, url: ${config.ai_api}, model: ${config.ai_model}`, { model: "testOpenAI" });
    return {
      success: true,
      message: "success"
    };
  } catch (error) {
    logger.error(error.message, { model: "testOpenAI" });
    return {
      success: false,
      message: error.message
    };
  }
}

export async function parseWithOpenAI(title, config) {
  let PROMPT = `You are an anime title extractor. Your task is to extract the main anime title from filename.

  Rules:
  1. If multiple titles exist in different languages, prioritize English title > Japanese title > Chinese title.
  2. Return clean title in JSON format in “title” field only.
  3. Return empty string if you cannot extract, do not make up factual data.

  Output format: {"title": "anime title"}`;

  try {
    const openai = new OpenAI({
      apiKey: config.ai_key,
      baseURL: config.ai_api,
    });
    const completion = await openai.chat.completions.create({
      model: config.ai_model,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: `return json for title: ${title}` }
      ],
      temperature: 1,
      response_format: { type: "json_object" }
    });

    // Some AI will return error message when some error occurs
    if (completion.choices[0].message.content.includes("error")) {
      throw new Error(completion.choices[0].message.content);
    }

    // Clean the result
    let result = completion.choices[0].message.content
    result = result.replace("```json", "").replace("```", "");

    // Parse result as JSON
    const resultJson = JSON.parse(result);
    if (!resultJson.title) {
      throw new Error(`Failed to parse JSON from AI result, title: ${title}, json: ${result}`);
    }

    logger.debug(`Parse anime title successfully, title: ${title}`, { model: "parseWithOpenAI" });
    return {
      success: true,
      message: "success",
      data: resultJson.title
    };
  } catch (error) {
    logger.error(error.message, { model: "parseWithOpenAI" });
    return {
      success: false,
      message: error.message
    };
  }
}
