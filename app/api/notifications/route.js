import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Get notification list

export async function GET(request) {
  try {
    const notification = await prisma.notification.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return sendResponse(request, {
      data: { notification }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Add a new notification
// Body: {
//   name: string, required
//   filter: string, required
//   type: string, required
//   url: string, required
//   token: string, required
//   title: string, required
//   message: string, required
//   extra: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Check if name is empty
    if (!data.name) {
      throw new Error("Notification name is required");
    }

    // Check if name already exists
    const existingName = await prisma.notification.findUnique({
      where: { name: data.name }
    });
    
    if (existingName) {
      throw new Error(`Notification already exists, name: ${data.name}`);
    }

    // Insert to database using Prisma
    await prisma.notification.create({
      data: {
        name: data.name,
        filter: data.filter,
        type: data.type,
        url: data.url,
        token: data.token,
        title: data.title,
        message: data.message,
        extra: data.extra,
        state: 1
      }
    });

    return sendResponse(request, {
      message: `Add notification successfully, name: ${data.name}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
