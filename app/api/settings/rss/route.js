import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { tasks } from "@/lib/schedule";

// Get RSS subscriptions
// Method: GET

export async function GET() {
  const db = await getDb();

  try {
    const rss = await db.all("SELECT * FROM rss ORDER BY name ASC");
    return Response.json({
      code: 200,
      message: "success",
      data: rss.map(item => ({
        ...item,
        next: tasks.get(item.name)?.nextInvocation() || null
      }))
    });
  }

  catch (error) {
    log.error(`Failed to load RSS subscriptions: ${error.message}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
