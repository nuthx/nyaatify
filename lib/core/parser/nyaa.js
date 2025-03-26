import { extractTitle } from "@/lib/core/extractor";
import { searchAnilistDetails } from "@/lib/api/anilist";
import { searchBangumiDetails } from "@/lib/api/bangumi";

export function animeHash(item) {
  return item.hash;
}

export async function fetchAnimeData(item) {
  const result = {
    anilist: null,
    bangumi: null,
    titleRaw: item.title,
    titleParsed: "",
    torrent: item.link,
    pubDate: item.pubDate,
    size: item.size
  };

  // Skip if category is not anime
  if (!item.categoryId.startsWith("1_")) return result;

  // Extract anime title from published title
  const title = await extractTitle(item.title);
  result.titleParsed = title;

  const anilist = await searchAnilistDetails(title);
  if (!anilist.success) return result;
  result.anilist = anilist.data;

  const bangumi = await searchBangumiDetails(anilist.data.title.native || title);
  if (!bangumi.success) return result;
  result.bangumi = bangumi.data;

  return result;
}
