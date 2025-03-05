import Bottleneck from "bottleneck";
import { JSDOM } from "jsdom";
import { logger } from "@/lib/logger";

const limiter = new Bottleneck({
  minTime: 1200,
  maxConcurrent: 1
});

export async function getBangumiIdFromMikan(episode_url) {
  try {
    // Extract root URL
    const rootUrl = episode_url.split("/Home")[0];

    // Step 1: Get anime homepage from episode page
    const episodeResponse = await limiter.schedule(() => fetch(episode_url));
    const episodeHtml = await episodeResponse.text();
    const episodeDoc = new JSDOM(episodeHtml).window.document;
    const homepageUrl = episodeDoc.querySelector("p.bangumi-title a.w-other-c").href;

    if (!homepageUrl) {
      throw new Error(`No homepage URL found at step 1, link: ${episode_url}`);
    }

    // Step 2: Get Bangumi ID from homepage
    const homepageResponse = await limiter.schedule(() => fetch(`${rootUrl}${homepageUrl}`)); 
    const homepageHtml = await homepageResponse.text();
    const homepageDoc = new JSDOM(homepageHtml).window.document;
    const bgmUrl = homepageDoc.querySelector('a[href^="https://bgm.tv/subject/"]').href;
    const bgmId = bgmUrl.split("/").pop();

    if (!bgmId) {
      throw new Error(`No Bangumi ID found at step 2, link: ${episode_url}`);
    }

    logger.debug(`Get Bangumi ID successfully, link: ${episode_url}`, { model: "getBangumiIdFromMikan" });
    return {
      success: true,
      message: "success",
      data: bgmId
    };
  } catch (error) {
    logger.warn(error.message, { model: "getBangumiIdFromMikan" });
    return {
      success: false,
      message: error.message
    };
  }
}
