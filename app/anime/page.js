"use client";

import Image from "next/image";
import { toast } from "sonner"
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Download, Pause, RefreshCcw, Trash2 } from "lucide-react";
import { PaginationPro } from "@/components/pagination";

export default function Anime() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);

  const { data: animeData, error: animeError, isLoading: animeLoading, mutate: mutateAnime } = useData(`${API.ANIME}?page=${currentPage}`);

  // Set page title
  useEffect(() => {
    document.title = `${t("nav.anime")} - Nyaatify`;
  }, [t]);

  // To show url address with correct page
  // If first page, hide page number
  const handlePageChange = (page) => {
    setCurrentPage(page);
    router.push(`/anime${page > 1 ? `?page=${page}` : ""}`);
  };

  const handleManage = async (action, downloader, hash) => {
    const result = await handleRequest("POST", API.TORRENTS, { action, downloader, hash }, t(`toast.failed.${action}`));
    if (result) {
      if (action === "download") {
        toast(t(`toast.start.download`));
      }
      mutateAnime();
    }
  };

  // Get title by priority
  // If not found, return parsed title, then original title
  const getTitleByPriority = (item, priority) => {
    const priorities = priority.split(",");
    for (const p of priorities) {
      switch (p) {
        case "jp":
          if (item.titleJp) return item.titleJp;
          break;
        case "romaji":
          if (item.titleRomaji) return item.titleRomaji;
          break;
        case "cn":
          if (item.titleCn) return item.titleCn;
          break;
        case "en":
          if (item.titleEn) return item.titleEn;
          break;
      }
    }
    return item.titleParsed || item.titleRaw;
  };

  if (animeLoading) {
    return <></>;
  }

  // Show error message if request failed or no anime
  let errorMessage = "";
  if (animeError) {
    errorMessage = animeError.message;
  } else if (animeData.anime.length === 0) {
    errorMessage = t("anime.empty");
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8 px-6 md:px-10">{errorMessage}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6 px-6 md:px-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex gap-4 mx-1 mb-2 col-span-1 md:col-span-2">
          {animeData.config.downloaderStateDisplay === "1" && !animeData.config.defaultDownloader && <Badge variant="outline">{t("anime.no_downloader")}</Badge>}
          {animeData.config.downloaderStateDisplay === "1" && animeData.config.defaultDownloader && animeData.config.defaultDownloaderOnline === "0" && <Badge variant="destructive">{t("anime.downloader_offline")}</Badge>}
          <a className="text-sm text-muted-foreground">{t("anime.today")}: {animeData.count.today}</a>
          <a className="text-sm text-muted-foreground">{t("anime.week")}: {animeData.count.week}</a>
          <a className="text-sm text-muted-foreground">{t("anime.total")}: {animeData.count.total}</a>
        </div>
        {animeData.anime?.map((item, index) => (
          <Card key={index} className="flex flex-col">
            <CardContent className="flex gap-4 flex-1">
              <div className="relative min-w-20 max-w-20 min-h-28 max-h-28 rounded-md bg-muted overflow-hidden">
                {(item.coverAnilist || item.coverBangumi) && (
                  <Image
                    src={animeData.config.animeCoverSource === "anilist" 
                      ? (item.coverAnilist || item.coverBangumi) 
                      : (item.coverBangumi || item.coverAnilist)}
                    alt="Anime cover"
                    fill
                    className="object-cover"
                    draggable="false"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 my-1 w-fit">
                <div className="flex gap-2">
                  <Badge variant="outline">{new Date(item.pubDate).toLocaleString()}</Badge>
                  {item.rss?.map((rss, idx) => (
                    <Badge key={idx} variant="outline">{rss.name}</Badge>
                  ))}
                </div>
                <div className="w-fit">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <a href={item.torrent} target="_blank" className="font-medium hover:underline">
                          {getTitleByPriority(item, animeData.config.animeTitlePriority)}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="py-2 space-y-1">
                        {item.titleCn && <p><a className="font-bold">CN: </a>{item.titleCn}</p>}
                        {item.titleJp && <p><a className="font-bold">JP: </a>{item.titleJp}</p>}
                        {item.titleEn && <p><a className="font-bold">EN: </a>{item.titleEn}</p>}
                        {item.titleRomaji && <p><a className="font-bold">Romaji: </a>{item.titleRomaji}</p>}
                        {!item.titleCn && !item.titleJp && !item.titleEn && !item.titleRomaji && item.titleParsed && <p><a className="font-bold">Title: </a>{item.titleParsed}</p>}
                        {!item.titleCn && !item.titleJp && !item.titleEn && !item.titleRomaji && !item.titleParsed && <p>{item.titleRaw}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <a className="text-sm text-muted-foreground">{item.titleRaw}</a>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {item.downloader && <Badge>{t(`downloads.state.${item.downloader.state}`)}</Badge>}
                <a className="text-sm text-muted-foreground">{item.downloader ? `${item.downloader.completed} / ${item.downloader.size} (${item.downloader.progress === 1 ? 100 : (item.downloader.progress*100).toFixed(1)}%)` : item.size}</a>
              </div>
              <div className="flex items-center gap-2">
                {item.downloader? (
                  <>
                    {["uploading", "queuedUP", "stalledUP", "allocating", "downloading", "metaDL",
                      "queuedDL", "stalledDL", "checkingDL", "forcedDL", "checkingResumeData"].includes(item.downloader.state) && (
                      <Button variant="outline" className="font-normal" onClick={() => handleManage("pause", item.downloader.name, item.hash)}>
                        <Pause />{t("glb.pause")}
                      </Button>
                    )}
                    {["pausedUP", "pausedDL", "stoppedUP", "stoppedDL"].includes(item.downloader.state) && (
                      <Button className="font-normal" onClick={() => handleManage("resume", item.downloader.name, item.hash)}>
                        <RefreshCcw />{t("glb.resume")}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="font-normal">
                          <Trash2 />{t("glb.delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("glb.confirm_delete")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("downloads.alert")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("glb.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleManage("delete", item.downloader.name, item.hash)}>
                            {t("glb.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("download", animeData.config.defaultDownloader, item.hash)} disabled={!animeData.config.defaultDownloader || animeData.config.defaultDownloaderOnline === "0"}>
                    <Download />{t("glb.download")}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <PaginationPro currentPage={currentPage} totalPages={Math.ceil(animeData.pagination.total / animeData.pagination.size)} onPageChange={handlePageChange} />
    </div>
  );
}
