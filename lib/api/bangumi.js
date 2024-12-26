import { RateLimiter } from "@/lib/limiter";

const rateLimiter = new RateLimiter();
const baseUrl = "https://api.bgm.tv";

export async function getBangumiDetails(id) {
  try {
    await rateLimiter.requestPerMinutes(50);

    const response = await fetch(`${baseUrl}/v0/subjects/${id}`);
    const data = await response.json();

    if (data.title) {
      throw new Error(data.title);
    } else if (!data) {
      return null;
    } else {
      return data;
    }
  }
  
  catch (error) {
    throw new Error(`bangumi error | ${baseUrl}/v0/subjects/${id} | ${error.message}`);
  }
}

export async function searchBangumiDetails(name_jp) {
  try {
    await rateLimiter.requestPerMinutes(50);

    const response = await fetch(`${baseUrl}/v0/search/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: name_jp,
        filter: { type: [2] }
      }),
    });
    const data = await response.json();

    if (data.title) {
      throw new Error(data.title);
    } else if (!data?.data) {
      return null;
    } else {
      return data.data[0];
    }
  }

  catch (error) {
    throw new Error(`bangumi error | ${baseUrl}/v0/search/subjects | ${error.message}`);
  }
}