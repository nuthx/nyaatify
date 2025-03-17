import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Get current username

export async function GET(request) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    return sendResponse(request, {
      data: { username: user.username }
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Change username
// Body: {
//   values: {
//     new_username: string, required
//   }
// }

export async function PATCH(request) {
  try {
    const data = await request.json();

    // Check if the new username is the same as the current username
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });

    if (user.username === data.values.new_username) {
      throw new Error("New username is the same as the current username");
    }

    // Update username
    await prisma.user.update({
      where: { id: 1 },
      data: { username: data.values.new_username }
    });

    return sendResponse(request, {
      message: `Change username successfully, username: ${data.values.new_username}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
