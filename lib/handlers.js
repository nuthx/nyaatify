export async function handlePost(api, body) {
  try {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    });

    const data = await response.json();

    if (!response.ok) {
      return data.error;
    }

    return "success";
  }
  
  catch (error) {
    return error.message;
  }
};
