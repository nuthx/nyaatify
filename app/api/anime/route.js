import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();

  try {
    const anime = await db.all('SELECT * FROM anime ORDER BY date DESC LIMIT 50');
    return Response.json({
      code: 200,
      message: 'success',
      data: anime
    });
  }
  
  catch (error) {
    return Response.json({
      code: 500,
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
