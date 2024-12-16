import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();

  try {
    const anime = await db.all('SELECT * FROM anime ORDER BY date DESC LIMIT 50');
    return Response.json({ anime });
  } catch (error) {
    console.error('Failed to fetch anime:', error);
    return Response.json({ error: 'Failed to fetch anime' }, { status: 500 });
  }
}
