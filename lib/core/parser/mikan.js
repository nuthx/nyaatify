import { formatBytes } from "@/lib/bytes";
import { searchAnimeDetailFromAnilist } from "@/lib/api/anilist";
import { getAnimeDetailFromBangumi } from "@/lib/api/bangumi";
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
    size: formatBytes(item.enclosure.length)
  };

  const bangumiId = await getBangumiIdFromMikan(item.torrent.link[0]);
  if (!bangumiId) return result;

  const bangumi = await getAnimeDetailFromBangumi(bangumiId);
  if (!bangumi) return result;
  result.bangumi = bangumi;

  const anilist = await searchAnimeDetailFromAnilist(bangumi.name);
  if (!anilist) return result;
  result.anilist = anilist;

  return result;
}
