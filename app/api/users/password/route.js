import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Change user password
// Body: {
//   current_password: string, required
//   new_password: string, required
// }

export async function PATCH(request) {
  try {
    const data = await request.json();

    // Check if current password is correct
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    const hashedPassword = crypto.createHash("sha256").update(data.current_password).digest("hex");
    if (user.password !== hashedPassword) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    await prisma.user.update({
      where: { id: 1 },
      data: { password: data.new_password }
    });

    return sendResponse(request, {
      message: "Change password successfully"
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
