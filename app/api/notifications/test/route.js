import { sendResponse } from "@/lib/http/response";
import { dispatchNotification } from "@/lib/notification";

// Test a notification push
// Body: {
//   name: string, required
//   type: string, required
//   url: string, required
//   token: string, required
//   title: string, required
//   message: string, required
//   extra: string, required
// }

export async function POST(request) {
  try {
    const data = await request.json();

    // Generate demo variable
    const demo_variable = {
      rss: "Demo Subscription",
      title_raw: "[Moozzi2] Gimai Seikatsu [ 義妹生活 ] (BD 1920x1080 x265-10Bit Flac) - TV + SP + 4K",
      title_jp: "義妹生活",
      title_cn: "义妹生活",
      title_en: "Days with My Stepsister",
      title_romaji: "Gimai Seikatsu",
      torrent_link: "https://nyaa.si/download/1916672.torrent",
      torrent_hash: "3ee5acff820b47775974729583f823e8eee4ef9b",
      torrent_size: "24.2 GiB",
      cover_anilist: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx152681-xtQiVOYDhr3p.jpg",
      cover_bangumi: "https://lain.bgm.tv/r/400/pic/cover/l/40/01/393037_I7mvN.jpg",
      page_anilist: "https://anilist.co/anime/152681",
      page_bangumi: "https://bgm.tv/subject/393037"
    }

    // Dispatch test notification
    const notificationResult = await dispatchNotification(data, demo_variable);

    if (!notificationResult.success) {
      throw new Error(notificationResult.message);
    }

    return sendResponse(request, {
      message: `Test notification successfully, name: ${data.name}`
    });
  } catch (error) {
    return sendResponse(request, {
      code: 500,
      message: error.message
    });
  }
}
