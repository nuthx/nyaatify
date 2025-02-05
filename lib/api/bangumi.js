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
      throw new Error(`No Bangumi result found, id: ${id}`);
    }

    return {
      success: true,
      message: "success",
      data: result
    };
  } catch (error) {
    logger.error(error.message, { model: "getBangumiDetails" });
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}

export async function searchBangumiDetails(name_jp) {
  try {
    const response = await limiter.schedule(() => fetch(`${baseUrl}/v0/search/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: name_jp,
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
      throw new Error(`No Bangumi result found, item: ${name_jp}`);
    }

    return {
      success: true,
      message: "success",
      data: result.data[0]
    };
  } catch (error) {
    logger.error(error.message, { model: "searchBangumiDetails" });
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
}