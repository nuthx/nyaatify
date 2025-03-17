import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

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

    return sendResponse(request, {
      data: { valid: true }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 401,
      message: error.message,
      data: { valid: false }
    });
  }
}
