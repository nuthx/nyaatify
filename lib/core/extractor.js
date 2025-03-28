import { parse } from "anitomy";
import { getConfig } from "@/lib/db";
import { logger } from "@/lib/logger";
import { useOpenAI } from "@/lib/api/openai";

export const SYSTEM_PROMPT = 
`请从提供的发布标题中精确提取动画的多种语言名称，并以规范的JSON格式返回结果。
输出必须包含以下四个字段（若无对应内容则留空，不可编造或翻译）:
- "titleJp"
- "titleCn"
- "titleEn"
- "titleRomaji"

示例输出:
{
  "titleJp": "鬼滅の刃",
  "titleCn": "鬼灭之刃",
  "titleEn": "Demon Slayer",
  "titleRomaji": "Kimetsu no Yaiba"
}`;

export const USER_PROMPT = `请处理此发布标题并返回JSON: `;

export async function extractTitle(title) {
  const config = await getConfig();

  // AI priority
  if (config.aiPriority === "ai-first") {
    const aiResult = await extractTitleWithAI(title);
    return aiResult || extractTitleWithAnitomy(title);
  }

  // Local priority
  return extractTitleWithAnitomy(title);
}

async function extractTitleWithAI(title) {
  try {
    // Get result from AI
    const result = await useOpenAI(SYSTEM_PROMPT, `${USER_PROMPT}${title}`);
    if (!result.success) {
      throw new Error(result.message);
    }

    // Parse result data to JSON
    const resultJson = JSON.parse(result.data.replace("```json", "").replace("```", ""));
    const resultTitle = resultJson.titleEn || resultJson.titleRomaji || resultJson.titleCn || resultJson.titleJp;
    if (!resultTitle) {
      throw new Error(`No available title returned, output: ${result.data}`);
    }

    logger.debug(`AI extraction successful, title: ${title}, result: ${resultTitle}`, { model: "extractTitleWithAI" });
    return resultTitle;
  } catch (error) {
    logger.warn(`AI extraction failed, title: ${title}, error: ${error.message}`, { model: "extractTitleWithAI" });
    return null;
  }
}

function extractTitleWithAnitomy(title) {
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

function splitEnglishTitle(title) {
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
