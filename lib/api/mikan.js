import Bottleneck from "bottleneck";
import { JSDOM } from 'jsdom';

const limiter = new Bottleneck({
  minTime: 1200,
  maxConcurrent: 1
});

export async function getBangumiId(episode_url) {
  try {
    // Extract root URL
    const rootUrl = episode_url.split("/Home")[0];

    // Get anime homepage from episode page
    const episodeResponse = await limiter.schedule(() => fetch(episode_url));
    const episodeHtml = await episodeResponse.text();
    const episodeDoc = new JSDOM(episodeHtml).window.document;
    const homepageUrl = episodeDoc.querySelector("p.bangumi-title a.w-other-c").href;

    if (!homepageUrl) {
      return null;
    }

    // Get Bangumi ID from homepage
    const homepageResponse = await limiter.schedule(() => fetch(`${rootUrl}${homepageUrl}`)); 
    const homepageHtml = await homepageResponse.text();
    const homepageDoc = new JSDOM(homepageHtml).window.document;
    const bgmUrl = homepageDoc.querySelector('a[href^="https://bgm.tv/subject/"]').href;
    const bgmId = bgmUrl.split("/").pop();

    if (!bgmId) {
      return null;
    } else {
      return bgmId;
    }
  }
  
  catch (error) {
    throw new Error(`mikan error | ${episode_url} | ${error.message}`);
  }
}
