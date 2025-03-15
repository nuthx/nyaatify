export async function handleRequest(method, api, body = null) {
  try {
    const response = await fetch(api, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: body
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return {
      success: true,
      message: "success",
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};
