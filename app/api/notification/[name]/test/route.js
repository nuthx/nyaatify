import { logger } from "@/lib/logger";
import { dispatchNotification } from "@/lib/notification";

// Test a notification push
// Body: {
//   values: {
//     type: string, required
//     url: string, required
//     token: string, required
//     title: string, required
//     message: string, required
//     extra: string, required
//   }
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Dispatch test notification
    const notificationResult = await dispatchNotification(data.values);

    if (!notificationResult.success) {
      throw new Error(notificationResult.message);
    }

    logger.info(`Notification test successfully, name: ${data.values.name}`, { model: "POST /api/notification/name/test" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    // logger.error(error.message, { model: "POST /api/notification/test" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
