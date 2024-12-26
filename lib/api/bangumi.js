import { RateLimiter } from "@/lib/limiter";

const rateLimiter = new RateLimiter();
const baseUrl = "https://api.bgm.tv";

export async function getBangumiDetails(id) {
  try {
    await rateLimiter.requestPerMinutes(50);

    const response = await fetch(`${baseUrl}/v0/subjects/${id}`);
    const data = await response.json();

    if (!data?.data) {
      return null;
    } else {
      return data.data;
    }
  }
  
  catch (error) {
    throw new Error(`bangumi error | ${baseUrl}/v0/subjects/${id} | ${error.message}`);
  }
}
