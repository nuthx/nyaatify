import OpenAI from "openai";

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
      return completion.choices[0].message.content;
    }

    return "success";
  } catch (error) {
    return error.message;
  }
}

export async function parseByOpenAI(title, config) {
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
      return null;
    }

    // Clean the result
    let result = completion.choices[0].message.content
    result = result.replace("```json", "").replace("```", "");

    // Parse result as JSON
    const resultJson = JSON.parse(result);
    if (!resultJson.title) {
      return null;
    }

    return resultJson.title;
  } catch (error) {
    return null;
  }
}
