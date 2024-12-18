import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();

  try {
    const servers = await db.all('SELECT * FROM server');
    return Response.json({
      code: 200,
      message: "success", 
      data: servers
    });
  }
  
  catch (error) {
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
