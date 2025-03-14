import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Check if the token is valid
// Body: {
//   token: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Check if this token exists in the database
    const device = await prisma.device.findUnique({
      where: {
        token: data.token.value
      }
    });

    if (!device) {
      throw new Error(`Invalid token, token: ${data.token}`);
    }

    // Update last active time
    await prisma.device.update({
      where: {
        token: data.token.value
      },
      data: {
        lastActiveAt: new Date()
      }
    });

    return Response.json({
      code: 200,
      message: "success",
      data: {
        valid: true
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/auth/verify" });
    return Response.json({
      code: 401,
      message: error.message,
      data: {
        valid: false
      }
    }, { status: 401 });
  }
}
