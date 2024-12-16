import Parser from 'rss-parser';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get('url');

  if (!rssUrl) {
    return Response.json({ error: 'RSS URL is required' }, { status: 400 });
  }

  try {
    // Add Nyaa custom fields
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
    return Response.json({ items: feed.items });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch RSS' }, { status: 500 });
  }
}
