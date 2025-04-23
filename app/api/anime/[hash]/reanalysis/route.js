import { prisma } from "@/lib/db";
import { getAnimeDetailFromAnilist } from "@/lib/api/anilist";
import { getAnimeDetailFromBangumi } from "@/lib/api/bangumi";
import { sendResponse } from "@/lib/http/response";

// Refresh anime info by manually input anilist or bangumi id
// Body: {
//   anilist_id: string, optional
//   bangumi_id: string, optional
// }
export async function POST(request, { params }) {
  try {
    const data = await request.json();
    const hash = (await params).hash;
    let newAnilist = null;
    let newBangumi = null;

    const anime = await prisma.anime.findUnique({
      where: { hash },
    });

    if (!anime) {
      throw new Error("No anime found");
    }

    if (
      (!data.anilist_id || data.anilist_id === anime.idAnilist) && 
      (!data.bangumi_id || data.bangumi_id === anime.idBangumi)
    ) {
      throw new Error("No change");
    }

    if (data.anilist_id) {
      newAnilist = await getAnimeDetailFromAnilist(data.anilist_id);
    }

    if (data.bangumi_id) {
      newBangumi = await getAnimeDetailFromBangumi(data.bangumi_id);
    }

    if (newAnilist) {
      await prisma.anime.update({
        where: { hash },
        data: {
          titleJp: newAnilist?.title?.native,
          titleEn: newAnilist?.title?.english,
          titleRomaji: newAnilist?.title?.romaji,
          coverAnilist: newAnilist?.coverImage?.extraLarge,
          idAnilist: data.anilist_id
        }
      });
    }

    if (newBangumi) {
      await prisma.anime.update({
        where: { hash },
        data: {
          titleJp: newBangumi?.name,  // Japanese title in bangumi will replace the title in anilist
          titleCn: newBangumi?.name_cn,
          coverBangumi: newBangumi?.images?.large,
          idBangumi: data.bangumi_id
        }
      });
    }

    return sendResponse(request, {
      message: "Anime info updated successfully"
    });
  } catch (error) {
    if (error.message === "No change") {
      return sendResponse(request, {
        code: 240,
        message: error.message
      });
    }

    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
