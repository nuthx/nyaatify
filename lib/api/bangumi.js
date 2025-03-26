import Bottleneck from "bottleneck";
import { logger } from "@/lib/logger";

const baseUrl = "https://api.bgm.tv";

const limiter = new Bottleneck({
  minTime: 1200,
  maxConcurrent: 1
});

export async function getAnimeDetailFromBangumi(id) {
  try {
    const response = await limiter.schedule(() => fetch(`${baseUrl}/v0/subjects/${id}`));
    const result = await response.json();

    // Error (message in title)
    if (result.title) {
      throw new Error(result.title);
    }

    // No result
    else if (!result) {
      throw new Error("Unable to get anime detail");
    }

    logger.debug(`Get anime detail successfully, id: ${id}`, { model: "getAnimeDetailFromBangumi" });
    return result;
  } catch (error) {
    logger.warn(`${error.message}, id: ${id}`, { model: "getAnimeDetailFromBangumi" });
    return null;
  }
}

export async function searchAnimeDetailFromBangumi(titleJp) {
  try {
    const response = await limiter.schedule(() => fetch(`${baseUrl}/v0/search/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: titleJp,
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
      throw new Error("Unable to search anime detail");
    }

    logger.debug(`Search anime detail successfully, title: ${titleJp}`, { model: "searchAnimeDetailFromBangumi" });
    return result.data[0];
  } catch (error) {
    logger.warn(`${error.message}, title: ${titleJp}`, { model: "searchAnimeDetailFromBangumi" });
    return null;
  }
}
