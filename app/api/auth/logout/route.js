import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Logout

export async function DELETE() {
  try {
    // Get the auth token from the cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token");

    // Delete the auth token from the database
    await prisma.device.delete({
      where: {
        token: authToken.value
      }
    });

    // Delete the auth token on browser
    cookieStore.delete("auth_token");

    logger.info("Logout successfully", { model: "DELETE /api/auth/logout" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/auth/logout" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
