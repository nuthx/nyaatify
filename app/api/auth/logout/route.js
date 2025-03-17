import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

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

    return sendResponse(request, {
      message: "Logout successfully"
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
