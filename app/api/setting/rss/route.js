import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  try {
    const rss = await db.all("SELECT * FROM rss ORDER BY id ASC");
    return Response.json({
      code: 200,
      message: "success", 
      data: rss
    });
  }
  
  catch (error) {
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
