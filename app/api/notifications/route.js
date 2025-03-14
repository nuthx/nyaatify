import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Get notification list

export async function GET() {
  try {
    const notification = await prisma.notification.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return Response.json({
      code: 200,
      message: "success",
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/notifications" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new notification
// Body: {
//   values: {
//     name: string, required
//     filter: string, required
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

    // Check if name is empty
    if (!data.values.name?.trim()) {
      throw new Error("Notification name is required");
    }

    // Check if name already exists
    const existingName = await prisma.notification.findUnique({
      where: { name: data.values.name.trim() }
    });
    
    if (existingName) {
      throw new Error(`Notification already exists, name: ${data.values.name}`);
    }

    // Insert to database using Prisma
    await prisma.notification.create({
      data: {
        name: data.values.name.trim(),
        filter: data.values.filter.trim(),
        type: data.values.type.trim(),
        url: data.values.url.trim(),
        token: data.values.token.trim(),
        title: data.values.title.trim(),
        message: data.values.message.trim(),
        extra: data.values.extra.trim(),
        state: 1
      }
    });

    logger.info(`Add notification successfully, name: ${data.values.name}`, { model: "POST /api/notifications" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/notifications" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
