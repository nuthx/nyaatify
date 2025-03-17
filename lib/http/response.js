import { logger } from "@/lib/logger";

/**
 * Send a standardized JSON response with logging
 * Model will be automatically extracted from request, e.g. "GET /api/anime"
 * @param {Request} request - Request object
 * @param {Object} options - Response options
 * @param {number} [options.code=200] - Response code (also used as HTTP status)
 * @param {string} [options.message="success"] - Response message, if not "success", will be logged as info (200-299) or error (300-599)
 * @param {any} [options.data=null] - Response data payload
 * @param {string} [options.logMessage=""] - Optional message for logging a different message
 * @returns {Response} JSON formatted HTTP Response object
 */
export function sendResponse(request, { code = 200, message = "success", data = null, logMessage = "" }) {
  // Extract method and pathname as model for logging
  const method = request.method;
  const pathname = new URL(request.url).pathname;
  const model = `${method} ${pathname}`;

  // Log based on status code and logMessage
  if (code >= 200 && code <= 299) {
    if (logMessage || message !== "success") {
      logger.info(logMessage || message, { model });
    }
  } else {
    logger.error(logMessage || message, { model });
  }

  return Response.json({ code, message, data }, { 
    status: code
  });
}
