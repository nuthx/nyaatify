import { logger } from "@/lib/logger";

/**
 * Send a standardized JSON response with logging
 * Only log error when status code is not in 2xx range
 * Model will be automatically extracted from request, e.g. "GET /api/anime"
 * @param {Request} request - Request object
 * @param {Object} options - Response options
 * @param {number} [options.code=200] - Response code (also used as HTTP status)
 * @param {string} [options.message="success"] - Response message
 * @param {*} [options.data=null] - Response data payload
 * @returns {Response} JSON formatted HTTP Response object
 */
export function sendResponse(request, { code = 200, message = "success", data = null }) {
  // Extract method and pathname as model for logging
  const method = request.method;
  const pathname = new URL(request.url).pathname;
  const model = `${method} ${pathname}`;

  // Log error if status code is not in 2xx range
  if (code < 200 || code > 299) {
    logger.error(message, { model });
  }

  return Response.json({ code, message, data }, { 
    status: code 
  });
}
