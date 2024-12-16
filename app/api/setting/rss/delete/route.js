import { getDb } from '@/lib/db';

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    await db.run('DELETE FROM rss WHERE id = ?', [data.id]);
    return Response.json({
      code: 200,
      message: 'success',
      data: null
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
