import { RateLimiter } from "@/lib/limit";

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
    await rateLimiter.wait(3, 10);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        variables: { search: name_title }
      }),
    });

    const data = await response.json();
    return data.data.Page.media[0];
  }

  catch (error) {
    throw new Error(`Failed to get Anilist details from ${name_title}: ${error.message}`);
  }
}
