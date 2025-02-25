import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Get notification list

export async function GET() {
  try {
    const db = await getDb();
    const notification = await db.all("SELECT * FROM notification ORDER BY name ASC");

    return Response.json({
      code: 200,
      message: "success",
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "GET /api/notification" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}

// Add a new notification
// Body: {
//   values: {
//     name: string, required
//     filter: string, required
//     type: string, required
//     url: string, required
//     token: string, required
//     title: string, required
//     message: string, required
//     extra: string, required
//   }
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if name is empty
    if (data.values.name.trim() === "") {
      throw new Error("Name is required");
    }

    // Check if name already exists
    const existingName = await db.get("SELECT name FROM notification WHERE name = ?", data.values.name.trim());
    if (existingName) {
      throw new Error(`Notification already exists, name: ${data.values.name}`);
    }

    // Insert to database
    await db.run(
      "INSERT INTO notification (name, filter, type, url, token, title, message, extra, state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        data.values.name.trim(),
        data.values.filter.trim(),
        data.values.type.trim(),
        data.values.url.trim(),
        data.values.token.trim(),
        data.values.title.trim(),
        data.values.message.trim(),
        data.values.extra.trim(),
        1,
        new Date().toISOString()
      ]
    );

    logger.info(`Notification added successfully, name: ${data.values.name}`, { model: "POST /api/notification" });
    return Response.json({
      code: 200,
      message: "success"
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/notification" });
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
