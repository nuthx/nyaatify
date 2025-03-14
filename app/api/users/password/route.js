import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Change user password
// Body: {
//   values: {
//     current_password: string, required
//     new_password: string, required
//   }
// }

export async function PATCH(request) {
  try {
    const data = await request.json();

    // Check if current password is correct
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    const hashedPassword = crypto.createHash("sha256").update(data.values.current_password).digest("hex");
    if (user.password !== hashedPassword) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    await prisma.user.update({
      where: { id: 1 },
      data: { password: data.values.new_password }
    });

    logger.info("Change password successfully", { model: "PATCH /api/users/password" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/users/password" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
