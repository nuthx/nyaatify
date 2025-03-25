import { searchAnilistDetails } from "@/lib/api/anilist";
import { getBangumiDetails } from "@/lib/api/bangumi";
import { getBangumiIdFromMikan } from "@/lib/api/mikan";

export function animeHash(item) {
  return item.link.split("/").pop();
}

export async function fetchAnimeData(item) {
  const result = {
    anilist: null,
    bangumi: null,
    titleRaw: item.title,
    titleParsed: "",
    torrent: item.enclosure.url,
    pubDate: item.torrent.pubDate,
    size: item.enclosure.length
  };

  const bangumiId = await getBangumiIdFromMikan(item.torrent.link[0]);
  if (!bangumiId.success) return result;

  const bangumi = await getBangumiDetails(bangumiId.data);
  if (!bangumi.success) return result;
  result.bangumi = bangumi.data;

  const anilist = await searchAnilistDetails(bangumi.data.name);
  if (!anilist.success) return result;
  result.anilist = anilist.data;

  return result;
}
