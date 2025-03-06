import Bottleneck from "bottleneck";
import { logger } from "@/lib/logger";

const baseUrl = "https://graphql.anilist.co";

const limiter = new Bottleneck({
  // https://docs.anilist.co/guide/rate-limiting#rate-limiting
  // Notion: The Anilist API is currently in a degraded state and is limited to
  // 30 requests per minute. For now, we will limit to 20 requests per minute.
  // BTW, the AniList API has a rate limit of 90 requests per minute.
  minTime: 3000,
  maxConcurrent: 1
});

const query = `
query ($search: String!) {
  Page {
    media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
      }
    }
  }
}`;

export async function searchAnilistDetails(name_title) {
  try {
    const response = await limiter.schedule(() => fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        variables: { search: name_title }
      }),
    }));
    const result = await response.json();

    // Search error
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    // No result
    if (!result?.data?.Page?.media?.[0]) {
      throw new Error(`No anime details found, title: ${name_title}`);
    }

    logger.debug(`Search anime details successfully, title: ${name_title}`, { model: "searchAnilistDetails" });
    return {
      success: true,
      message: "success",
      data: result.data.Page.media[0]
    };
  } catch (error) {
    logger.warn(error.message, { model: "searchAnilistDetails" });
    return {
      success: false,
      message: error.message
    };
  }
}
