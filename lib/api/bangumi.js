import Bottleneck from "bottleneck";
import { logger } from "@/lib/logger";

const baseUrl = "https://api.bgm.tv";

const limiter = new Bottleneck({
  minTime: 1200,
  maxConcurrent: 1
});

export async function getBangumiDetails(id) {
  try {
    const response = await limiter.schedule(() => fetch(`${baseUrl}/v0/subjects/${id}`));
    const result = await response.json();

    // Error (message in title)
    if (result.title) {
      throw new Error(result.title);
    }

    // No result
    else if (!result) {
      throw new Error(`No anime details found, id: ${id}`);
    }

    logger.debug(`Get anime details successfully, id: ${id}`, { model: "getBangumiDetails" });
    return {
      success: true,
      message: "success",
      data: result
    };
  } catch (error) {
    logger.warn(error.message, { model: "getBangumiDetails" });
    return {
      success: false,
      message: error.message
    };
  }
}

export async function searchBangumiDetails(title_jp) {
  try {
    const response = await limiter.schedule(() => fetch(`${baseUrl}/v0/search/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: title_jp,
        filter: { type: [2] }
      }),
    }));
    const result = await response.json();

    // Error (message in title)
    if (result.title) {
      throw new Error(result.title);
    }

    // No result
    else if (!result?.data) {
      throw new Error(`No anime found, title: ${title_jp}`);
    }

    logger.debug(`Search anime details successfully, title: ${title_jp}`, { model: "searchBangumiDetails" });
    return {
      success: true,
      message: "success",
      data: result.data[0]
    };
  } catch (error) {
    logger.warn(error.message, { model: "searchBangumiDetails" });
    return {
      success: false,
      message: error.message
    };
  }
}