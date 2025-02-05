export async function handlePost(api, body) {
  try {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    });
    const result = await response.json();

    if (!response.ok) {
      return { code: result.code, message: result.message, data: null };
    }
    return { code: 200, message: "success", data: result.data };
  } catch (error) {
    return { code: 500, message: error.message, data: null };
  }
};
