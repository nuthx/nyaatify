const baseUrl = "https://api.bgm.tv";

export async function getBangumiDetails(id) {
  try {
    const response = await fetch(`${baseUrl}/v0/subjects/${id}`);
    const data = await response.json();
    return data;
  }
  
  catch (error) {
    throw new Error(`Failed to get Bangumi details from ${baseUrl}/v0/subjects/${id}: ${error.message}`);
  }
}
