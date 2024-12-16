import { getDb } from '@/lib/db';

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();
  
  try {
    await db.run('UPDATE feeds SET enabled = 0 WHERE id = ?', [data.id]);
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
