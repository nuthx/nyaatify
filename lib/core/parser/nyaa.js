import { extractTitle } from "@/lib/core/extractor";
import { searchAnimeDetailFromAnilist } from "@/lib/api/anilist";
import { searchAnimeDetailFromBangumi } from "@/lib/api/bangumi";

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

  const anilist = await searchAnimeDetailFromAnilist(title);
  if (!anilist) return result;
  result.anilist = anilist;

  const bangumi = await searchAnimeDetailFromBangumi(anilist.title.native || title);
  if (!bangumi) return result;
  result.bangumi = bangumi;

  return result;
}
