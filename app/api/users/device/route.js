import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { sendResponse } from "@/lib/http/response";

// Get all devices with their tokens

export async function GET(request) {
  try {
    const devices = await prisma.device.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    // Delete expired devices
    await prisma.device.deleteMany({
      where: {
        expiredAt: {
          lt: new Date()
        }
      }
    });

    // Find current device index
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token");
    const currentDevice = devices.find(device => device.token === authToken.value);

    return sendResponse(request, {
      data: {
        devices: devices.map(({ token, ...rest }) => rest),  // Remove token from response
        currentDevice: currentDevice?.id || null
      }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
