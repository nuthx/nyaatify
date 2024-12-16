import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const feeds = await db.all('SELECT * FROM feeds WHERE enabled = 1 ORDER BY id ASC');
  return Response.json(feeds);
}
