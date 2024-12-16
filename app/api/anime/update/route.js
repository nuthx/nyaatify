import Parser from 'rss-parser';
import { getDb } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get('url');

  if (!rssUrl) {
    return Response.json({ error: 'RSS URL is required' }, { status: 400 });
  }

  try {
    const parser = new Parser({
      customFields: {
        item: [
          ['nyaa:size', 'size'],
          ['nyaa:category', 'category'],
          ['nyaa:categoryId', 'categoryId'],
          ['nyaa:seeders', 'seeders'], 
          ['nyaa:leechers', 'leechers'],
          ['nyaa:downloads', 'downloads'],
          ['nyaa:infoHash', 'infoHash'],
          ['nyaa:comments', 'comments'],
          ['nyaa:trusted', 'trusted'],
          ['nyaa:remake', 'remake']
        ],
      },
    });

    const feed = await parser.parseURL(rssUrl);
    const db = await getDb();

    for (const item of feed.items) {
      try {
        await db.run(`
          INSERT OR IGNORE INTO items (
            title, link, pubDate, size, category, categoryId,
            seeders, leechers, downloads, infoHash, comments,
            trusted, remake
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.title,
          item.link,
          item.pubDate,
          item.size,
          item.category,
          item.categoryId,
          item.seeders,
          item.leechers,
          item.downloads,
          item.infoHash,
          item.comments,
          item.trusted,
          item.remake
        ]);
      } catch (err) {
        console.error('Error inserting item:', err);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to fetch RSS:', error);
    return Response.json({ error: 'Failed to fetch RSS' }, { status: 500 });
  }
}
