import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Get all devices with their tokens

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: {
        lastActiveAt: "desc"
      }
    });

    // Find current device index
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token");
    const currentDevice = devices.find(device => device.token === authToken.value);

    return Response.json({
      code: 200,
      message: "success",
      data: {
        devices: devices.map(({ token, ...rest }) => rest),  // Remove token from response
        currentDevice: currentDevice?.id || null
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/device" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
