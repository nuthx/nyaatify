import Bottleneck from "bottleneck";
import { logger } from "@/lib/logger";

const limiter = new Bottleneck({
  minTime: 1200,
  maxConcurrent: 1
});

export async function getBangumiIdFromMikan(episode_url) {
  try {
    // Fetch 1: Get anime homepage from episode page
    const episodeResponse = await limiter.schedule(() => fetch(episode_url));
    const episodeHtml = await episodeResponse.text();
    const homepageMatch = episodeHtml.match(/class="bangumi-title">[^<]*<a[^>]+class="w-other-c"[^>]+href="([^"]+)"/);
    const homepageUrl = homepageMatch?.[1];
    if (!homepageUrl) {
      throw new Error("Unable to get anime homepage from episode page");
    }

    // Fetch 2: Get Bangumi ID from anime homepage
    const rootUrl = episode_url.split("/Home")[0];
    const homepageResponse = await limiter.schedule(() => fetch(`${rootUrl}${homepageUrl}`));
    const homepageHtml = await homepageResponse.text();
    const bgmMatch = homepageHtml.match(/href="https:\/\/bgm\.tv\/subject\/(\d+)"/);
    const bangumiId = bgmMatch?.[1];
    if (!bangumiId) {
      throw new Error("Unable to get Bangumi ID from anime homepage");
    }

    logger.debug(`Get Bangumi ID successfully, link: ${episode_url}`, { model: "getBangumiIdFromMikan" });
    return {
      success: true,
      message: "success",
      data: bangumiId
    };
  } catch (error) {
    logger.warn(`${error.message}, link: ${episode_url}`, { model: "getBangumiIdFromMikan" });
    return {
      success: false,
      message: error.message
    };
  }
}
