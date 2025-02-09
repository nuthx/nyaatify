import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Test a notification push
// Body: {
//   values: {
//     name: string
//     trigger: string
//     condition: string
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
    const db = await getDb();
    const data = await request.json();

    console.log(data);

    logger.info(`Notification test successfully, name: ${data.values.name}`, { model: "POST /api/notification/test" });
    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/notification/test" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
