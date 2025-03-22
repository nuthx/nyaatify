import { extractTitle } from "@/lib/core/extractor";
import { searchAnilistDetails } from "@/lib/api/anilist";
import { searchBangumiDetails } from "@/lib/api/bangumi";

export const parserConfig = {
  customFields: {
    item: [
      ["nyaa:infoHash", "hash"],
      ["nyaa:categoryId", "categoryId"],
      ["nyaa:size", "size"]
    ]
  }
};

export async function fetchAnimeData(item) {
  const result = {
    anilist: null,
    bangumi: null,
    hash: item.hash,
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

  const anilist = await searchAnilistDetails(title);
  if (!anilist.success) return result;
  result.anilist = anilist.data;

  const bangumi = await searchBangumiDetails(anilist.data.title.native || title);
  if (!bangumi.success) return result;
  result.bangumi = bangumi.data;

  return result;
}
