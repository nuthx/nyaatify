import { prisma } from "@/lib/db";
import { sendResponse } from "@/lib/http/response";

// Delete a notification
// Params: id, string, required

export async function DELETE(request, { params }) {
  try {
    const id = parseInt((await params).id);

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    return sendResponse(request, {
      message: `Delete notification successfully, id: ${id}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}

// Edit a notification
// Params: id, string, required
// Body: {
//   key1: value1,
//   key2: value2,
//   ...
// }

export async function PATCH(request, { params }) {
  try {
    const id = parseInt((await params).id);
    const data = await request.json();

    // Extract valid values
    const validValues = {};
    const fields = ["state"];
    fields.forEach(field => {
      if (data[field] !== undefined) validValues[field] = data[field];
    });

    // Update notification
    await prisma.notification.update({
      where: { id },
      data: validValues
    });

    return sendResponse(request, {
      message: `Edit notification successfully, id: ${id}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
