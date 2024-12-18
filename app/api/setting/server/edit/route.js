import { getDb } from '@/lib/db';

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if type already exists
    const existingType = await db.get("SELECT type FROM server WHERE type = ?", data.type);

    if (existingType) {
      await db.run(
        'UPDATE server SET url = ?, username = ?, password = ? WHERE type = ?',
        [data.url, data.username, data.password, data.type]
      );
    } else {
      await db.run(
        'INSERT INTO server (type, url, username, password) VALUES (?, ?, ?, ?)',
        [data.type, data.url, data.username, data.password]
      );
    }
    
    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
