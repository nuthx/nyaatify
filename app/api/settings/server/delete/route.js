import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

// Delete a download server
// Method: POST
// Body: {
//   id: number
//   name: string
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    await db.run("DELETE FROM server WHERE id = ?", [data.id]);

    log.info(`Download server deleted successfully, name: ${data.name}`);
    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Failed to delete download server: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
