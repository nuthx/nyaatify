import { getConfig } from "@/lib/db";

export async function getTitleFirst(anime) {
  const config = await getConfig();
  const priorities = config.animeTitlePriority.split(",").concat(["pr", "raw"]);
  const titleMap = {
    jp: anime.titleJp,
    romaji: anime.titleRomaji,
    cn: anime.titleCn,
    en: anime.titleEn,
    pr: anime.titleParsed,
    raw: anime.titleRaw
  };
  return titleMap[priorities.find(p => titleMap[p])];
}
