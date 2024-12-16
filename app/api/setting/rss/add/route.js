import { getDb } from '@/lib/db';

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if name already exists
    const existingName = await db.get('SELECT name FROM rss WHERE name = ?', data.name);
    if (existingName) {
      return Response.json({
        code: 400,
        message: 'name exists',
        data: null
      }, { status: 400 });
    }

    // Check if url already exists
    const existingUrl = await db.get('SELECT url FROM rss WHERE url = ?', data.url);
    if (existingUrl) {
      return Response.json({
        code: 400,
        message: 'url exists',
        data: null
      }, { status: 400 });
    }

    await db.run('INSERT INTO rss (name, url, interval) VALUES (?, ?, ?)', [data.name, data.url, data.interval]);
    return Response.json({
      code: 201,
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
