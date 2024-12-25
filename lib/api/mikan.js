import { JSDOM } from 'jsdom';

export async function getBangumiId(episode_url) {
  try {
    // Extract root URL
    const rootUrl = episode_url.split("/Home")[0];

    // Get anime homepage from episode page
    const episodeResponse = await fetch(episode_url);
    const episodeHtml = await episodeResponse.text();
    const episodeDoc = new JSDOM(episodeHtml).window.document;
    const homepageUrl = episodeDoc.querySelector("p.bangumi-title a.w-other-c").href;

    // Get Bangumi ID from homepage
    const homepageResponse = await fetch(`${rootUrl}${homepageUrl}`); 
    const homepageHtml = await homepageResponse.text();
    const homepageDoc = new JSDOM(homepageHtml).window.document;
    const bgmUrl = homepageDoc.querySelector('a[href^="https://bgm.tv/subject/"]').href;
    const bgmId = bgmUrl.split("/").pop();

    return bgmId;
  }
  
  catch (error) {
    throw new Error(`Failed to get Bangumi ID from ${episode_url}: ${error.message}`);
  }
}
