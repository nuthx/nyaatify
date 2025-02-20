import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

// Logout

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth_token");

    return Response.json({
      code: 200,
      message: "success",
      data: null
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/auth/logout" });
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
