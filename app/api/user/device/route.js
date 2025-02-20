import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Get all devices with their tokens

export async function GET(request) {
  try {
    const db = await getDb();
    const devices = await db.all("SELECT * FROM token ORDER BY last_used_at DESC");
    
    // Find current device index
    const auth_token = request.cookies.get('auth_token')?.value;
    const currentDevice = devices.find(device => device.token === auth_token);

    return Response.json({
      code: 200,
      message: "success",
      data: {
        devices: devices.map(({ token, ...rest }) => rest),  // Remove token from response
        current_device: currentDevice?.id || null
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/device" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
