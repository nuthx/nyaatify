import Bottleneck from "bottleneck";

const baseUrl = "https://graphql.anilist.co";

const limiter = new Bottleneck({
  minTime: 5000,
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

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }else if (!data?.data?.Page?.media?.[0]) {
      return null;
    } else {
      return data.data.Page.media[0];
    }
  }

  catch (error) {
    throw new Error(`anilist error | ${name_title} | ${error.message}`);
  }
}
