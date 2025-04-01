import { toast } from "sonner";

/**
 * Handles HTTP requests with error handling and toast notifications
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} api - The API URL
 * @param {Object|null} [values=null] - Optional request body data
 * @param {string} errorTitle - Title for error toast notification
 * @param {boolean} [stream=false] - If true, returns response object for streaming, otherwise returns parsed JSON
 * @returns {Promise<Response|Object|undefined>} Returns response object if stream=true, parsed JSON if stream=false, or undefined if error occurs
 */
export async function handleRequest(method, api, values = null, errorTitle, stream = false) {
  try {
    const response = await fetch(api, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: values ? JSON.stringify(values) : null
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    return stream ? response : await response.json();
  } catch (error) {
    toast.error(errorTitle, {
      description: error.message
    });
  }
};
