import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

// Check if the token is valid
// Body: {
//   token: string, required
// }

export async function POST(request) {
  try {
    const db = await getDb();
    const data = await request.json();

    // Check if this token in the database
    const result = await db.get("SELECT * FROM token WHERE token = ?", [data.token.value]);

    if (!result) {
      throw new Error(`Invalid token, token: ${data.token}`);
    }

    // Update last used time with ISO timestamp
    await db.run("UPDATE token SET last_used_at = ? WHERE token = ?", [new Date().toISOString(), data.token.value]);

    return Response.json({
      code: 200,
      message: "success",
      data: {
        valid: true
      }
    });
  } catch (error) {
    logger.error(error.message, { model: "POST /api/auth/verify" });
    return Response.json({
      code: 401,
      message: error.message,
      data: {
        valid: false
      }
    }, { status: 401 });
  }
}
