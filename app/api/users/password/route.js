import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Change user password
// Body: {
//   cur_password: string, required
//   new_password: string, required
// }

export async function PATCH(request) {
  try {
    const data = await request.json();

    // Check if current password is correct
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    if (data.cur_password === data.new_password) {
      throw new Error("New password cannot be the same as the current password");
    }

    if (user.password !== data.cur_password) {
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
