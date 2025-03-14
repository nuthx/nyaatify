import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a device
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const id = parseInt(params.id);

    // Delete device
    await prisma.device.delete({
      where: { id }
    });

    logger.info(`Delete device successfully, id: ${id}`, { model: "DELETE /api/device/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/device/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
