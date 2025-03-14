import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Delete a notification
// Params: id, string, required

export async function DELETE(_, { params }) {
  try {
    const id = parseInt(params.id);

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    logger.info(`Delete notification successfully, id: ${id}`, { model: "DELETE /api/notifications/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "DELETE /api/notifications/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Edit a notification
// Params: id, string, required
// Body: {
//   values: {
//     key1: value1,
//     key2: value2,
//     ...
//   }
// }

export async function PATCH(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();

    // Extract valid values
    const validValues = {};
    const fields = ["state"];
    fields.forEach(field => {
      if (data.values[field] !== undefined) validValues[field] = data.values[field];
    });

    // Update notification
    await prisma.notification.update({
      where: { id },
      data: validValues
    });

    logger.info(`Edit notification successfully, id: ${id}`, { model: "PATCH /api/notifications/[id]" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "PATCH /api/notifications/[id]" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
