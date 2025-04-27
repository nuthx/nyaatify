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

const baseQuery = `{
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
  }
}`;

export async function getAnimeDetailFromAnilist(id) {
  try {
    const response = await limiter.schedule(() => fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($id: Int!) { Media(id: $id, type: ANIME) ${baseQuery} }`,
        variables: { id: parseInt(id) }
      }),
    }));
    const result = await response.json();

    // Search error
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    // No result
    if (!result?.data?.Media) {
      throw new Error("Unable to search anime detail");
    }

    logger.debug(`Get anime detail successfully, id: ${id}`, { model: "getAnimeDetailFromAnilist" });
    return result.data.Media;
  } catch (error) {
    logger.warn(`${error.message}, id: ${id}`, { model: "getAnimeDetailFromAnilist" });
    return null;
  }
}

export async function searchAnimeDetailFromAnilist(titleParsed) {
  try {
    const response = await limiter.schedule(() => fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($search: String!) { Page { media(search: $search, type: ANIME) ${baseQuery} } }`,
        variables: { search: titleParsed }
      }),
    }));
    const result = await response.json();

    // Search error
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    // No result
    if (!result?.data?.Page?.media?.[0]) {
      throw new Error("Unable to search anime detail");
    }

    logger.debug(`Search anime detail successfully, title: ${titleParsed}`, { model: "searchAnimeDetailFromAnilist" });
    return result.data.Page.media[0];
  } catch (error) {
    logger.warn(`${error.message}, title: ${titleParsed}`, { model: "searchAnimeDetailFromAnilist" });
    return null;
  }
}
