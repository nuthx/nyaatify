import { parse } from "anitomy";
import { getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { useOpenAI } from "@/lib/api/openai";

export async function extractTitle(title) {
  const config = await getConfig();

  // AI priority
  if (config.aiPriority === "ai") {
    const aiResult = await extractTitleWithAI(title);
    return aiResult || extractTitleWithAnitomy(title);
  }

  // Local priority
  return extractTitleWithAnitomy(title);
}

export async function extractTitleWithAI(title) {
  const PROMPT = `You are an anime title extractor. Your task is to extract the main anime title from filename.
  Rules:
  1. If multiple titles exist in different languages, prioritize English title > Japanese title > Chinese title.
  2. Return clean title in JSON format in "title" field only.
  3. Return empty string if you cannot extract, do not make up factual data.
  Output format: {"title": "anime title"}`;

  try {
    // Parse result data by JSON
    const result = await useOpenAI(PROMPT, `return json for title: ${title}`);
    const resultJson = JSON.parse(result.replace("```json", "").replace("```", ""));
    
    if (!resultJson.title) {
      throw new Error(`Failed to parse json: ${result}`);
    }

    logger.debug(`AI extraction successful, title: ${title}, result: ${resultJson.title}`, { model: "extractTitleWithAI" });
    return resultJson.title;
  } catch (error) {
    logger.warn(`AI extraction failed, title: ${title}, error: ${error.message}`, { model: "extractTitleWithAI" });
    return null;
  }
}

export function extractTitleWithAnitomy(title) {
  // Remove invalid content from the title to avoid parsing failure
  const cleanedTitle = title
    .replace("BD-BOX", "")
    .replace("BD", "")
    .replace("DVD-BOX", "")
    .replace("DVD", "")
    .replace("- TV", "")
    .replace("+ OAD", "");

  // Parse the title with Anitomy
  const animeInfo = parse(cleanedTitle);
  if (!animeInfo?.title) {
    logger.warn(`Local extraction failed, title: ${title}`, { model: "extractTitleWithAnitomy" });
    return null;
  }

  // Some anime has more than one titles with different language, split by "/"
  // Anitomy cannot identify whether the title is composed of one or multiple titles
  // So it's needed to extract the English title due to search engine is Anilist
  // If title is too short, slash may be part of the title, like 22/7
  if (animeInfo.title.includes("/") && animeInfo.title.length > 15) {
    return splitEnglishTitle(animeInfo.title);
  }

  logger.debug(`Local extraction successful, title: ${animeInfo.title}, result: ${animeInfo.title}`, { model: "extractTitleWithAnitomy" });
  return animeInfo.title;
}

export function splitEnglishTitle(title) {
  let maxEnglishRatio = 0;
  let bestTitle = null;

  // Split title by "/" then trim each part
  // Calculate the ratio of English characters to total characters
  // The highest ratio part may be the English title
  const parts = title.split("/").map(part => part.trim());
  for (const part of parts) {
    const totalChars = part.length;
    if (totalChars === 0) continue;

    const englishAndNumbers = part.match(/[a-zA-Z0-9]/g)?.length || 0;
    const ratio = englishAndNumbers / totalChars;

    if (ratio > maxEnglishRatio) {
      maxEnglishRatio = ratio;
      bestTitle = part;
    }
  }

  return bestTitle;
}
