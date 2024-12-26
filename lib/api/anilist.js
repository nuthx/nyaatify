import { RateLimiter } from "@/lib/limiter";

const rateLimiter = new RateLimiter();
const baseUrl = "https://graphql.anilist.co";

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

export async function getAnilistDetails(name_title) {
  try {
    await rateLimiter.requestPerMinutes(50);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        variables: { search: name_title }
      }),
    });

    const data = await response.json();
    if (!data?.data?.Page?.media?.[0]) {
      return null;
    } else {
      return data.data.Page.media[0];
    }
  }

  catch (error) {
    throw new Error(`anilist error | ${name_title} | ${error.message}`);
  }
}
