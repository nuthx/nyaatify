import { getDb } from '@/lib/db';

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();
  
  try {
    await db.run(
      'INSERT INTO rss (name, url, interval) VALUES (?, ?, ?)',
      [data.name, data.url, data.interval]
    );
    return new Response(null, { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
