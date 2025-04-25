import * as cheerio from "cheerio";
import { formatBytes } from "@/lib/format";
import { extractTitle } from "@/lib/core/extractor";
import { searchAnimeDetailFromAnilist } from "@/lib/api/anilist";
import { getAnimeDetailFromBangumi, searchAnimeDetailFromBangumi } from "@/lib/api/bangumi";
import { getBangumiIdFromMikan } from "@/lib/api/mikan";

export function animeHash(item) {
  return item.link.split("/").pop();
}

export function extractDescription(html) {
  const $ = cheerio.load(html);
  let desc = "";
  desc = $(".episode-desc").children().first().remove();  // Remove the hidden tmall advertisement
  desc = $(".episode-desc").html();
  return desc;
}

export async function fetchAnimeData(item) {
  const result = {
    anilist: null,
    bangumi: null,
    titleRaw: item.title,
    titleParsed: "",
    torrent: item.enclosure.url,
    pubDate: item.torrent.pubDate,
    size: formatBytes(item.enclosure.length),
    url: item.torrent.link[0]
  };

  const bangumiId = await getBangumiIdFromMikan(item.torrent.link[0]);

  // Most of anime are related to Bangumi
  if (bangumiId) {
    const bangumi = await getAnimeDetailFromBangumi(bangumiId);
    if (!bangumi) return result;
    result.bangumi = bangumi;

    const anilist = await searchAnimeDetailFromAnilist(bangumi.name);
    if (!anilist) return result;
    result.anilist = anilist;
  }

  // Old anime and movies are not related to Bangumi
  else {
    const title = await extractTitle(item.title);
    result.titleParsed = title;

    const anilist = await searchAnimeDetailFromAnilist(title);
    if (!anilist) return result;
    result.anilist = anilist;

    const bangumi = await searchAnimeDetailFromBangumi(anilist.title.native || title);
    if (!bangumi) return result;
    result.bangumi = bangumi;
  }

  return result;
}
