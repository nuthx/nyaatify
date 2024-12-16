import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.all(`
      SELECT * FROM items 
      ORDER BY pubDate DESC 
      LIMIT 50
    `);

    return Response.json({ items });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return Response.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
