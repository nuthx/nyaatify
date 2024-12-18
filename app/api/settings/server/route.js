import { getDb } from '@/lib/db';
import { log } from '@/lib/log';

// Get server list
// Method: GET

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
    log.error(`Load server list failed: ${error}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
