import { getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseWithOpenAI } from "@/lib/api/openai";
import { parse } from "anitomy";

export async function extractTitle(title) {
  // Get parse method from config
  const config = await getConfig();

  // AI priority
  if (config.aiPriority === "ai") {
    // Extract title with AI first
    const aiResult = await extractTitleWithAI(title);
    // If no result of AI, use local parse
    if (!aiResult) {
      logger.warn(`AI extraction failed, attempting local extraction, title: ${title}`, { model: "extractTitle" });
      return extractTitleWithAnitomy(title);
    }
    return aiResult;
  }

  // Local priority
  return extractTitleWithAnitomy(title);
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
  const parsed = parse(cleanedTitle);

  if (!parsed || !parsed.title) {
    logger.warn(`Local extraction failed, title: ${title}`, { model: "extractTitleWithAnitomy" });
    return null;
  }

  // Some anime has more than one titles with different language, split by "/"
  // Anitomy cannot identify whether the title is composed of one or multiple titles
  // So it's needed to extract the English title due to search engine is Anilist
  // If title is too short, slash may be part of the title, like 22/7
  if (parsed.title.includes("/") && parsed.title.length > 15) {
    return splitEnglishTitle(parsed.title);
  }

  logger.debug(`Local extraction successful, title: ${parsed.title}, result: ${parsed.title}`, { model: "extractTitleWithAnitomy" });
  return parsed.title;
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

  logger.debug(`Split English title successfully, title: ${title}, result: ${bestTitle}`, { model: "splitEnglishTitle" });
  return bestTitle;
}

export async function extractTitleWithAI(title) {
  // Get AI config from config
  const config = await getConfig();

  // Check if AI config exists
  if (!config.aiApi || !config.aiKey || !config.aiModel) {
    logger.error("Missing config of AI server", { model: "extractTitleWithAI" });
    return null;
  }

  // Extract title with AI
  const result = await parseWithOpenAI(title, config);
  if (!result.success) {
    logger.warn(`AI extraction failed, title: ${title}`, { model: "extractTitleWithAI" });
    return null;
  }

  logger.debug(`AI extraction successful, title: ${title}, result: ${result.data}`, { model: "extractTitleWithAI" });
  return result.data;
}
