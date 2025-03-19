import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Delete a device
// Params: id, string, required

export async function DELETE(request, { params }) {
  try {
    const id = parseInt((await params).id);

    // Delete device
    await prisma.device.delete({
      where: { id }
    });

    return sendResponse(request, {
      message: `Delete device successfully, id: ${id}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
