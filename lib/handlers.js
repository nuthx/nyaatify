export async function handlePost(api, body) {
  try {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    });

    const data = await response.json();

    if (!response.ok) {
      return { state: "error", message: data.error };
    }

    return { state: "success", message: data };
  }
  
  catch (error) {
    return { state: "error", message: error.message };
  }
};
