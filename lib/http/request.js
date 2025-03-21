import { toast } from "sonner";

export async function handleRequest(method, api, values = null, errorTitle = "") {
  try {
    const response = await fetch(api, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: values ? JSON.stringify(values) : null
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    toast.error(errorTitle, {
      description: error.message
    });
  }
};
