"use client";

import useSWR from "swr";
import { toast } from "sonner"
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { handleRequest } from "@/lib/handlers";
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
  const animeApi = "/api/anime";
  const torrentsApi = "/api/torrents";

  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);

  const { data, error, isLoading, mutate } = useSWR(`${animeApi}?page=${currentPage}`, async (url) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    if (result.data.anime.length === 0) {
      throw new Error(t("anime.empty"));
    }
    return result.data;
  });

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
    const result = await handleRequest("POST", torrentsApi, JSON.stringify({ action, downloader, hash }));
    if (result.success) {
      if (action === "download") {
        toast(t(`toast.start.download`));
      }
      mutate();
    } else {
      toast.error(t(`toast.failed.${action}`), {
        description: result.message,
      });
    }
  };

  // Get title by priority
  // If not found, return parsed title, then original title
  const getTitleByPriority = (item, priority) => {
    const priorities = priority.split(",");
    for (const p of priorities) {
      switch (p) {
        case "jp":
          if (item.title_jp) return item.title_jp;
          break;
        case "romaji":
          if (item.title_romaji) return item.title_romaji;
          break;
        case "cn":
          if (item.title_cn) return item.title_cn;
          break;
        case "en":
          if (item.title_en) return item.title_en;
          break;
      }
    }
    return item.title_prased || item.title;
  };

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8">{error.message}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex gap-4 mx-1 mb-2 col-span-1 md:col-span-2">
          {data.config.show_downloader_state === "1" && !data.config.default_downloader && <Badge variant="outline">{t("anime.no_downloader")}</Badge>}
          {data.config.show_downloader_state === "1" && data.config.default_downloader && data.config.default_downloader_online === "0" && <Badge variant="destructive">{t("anime.downloader_offline")}</Badge>}
          <a className="text-sm text-muted-foreground">{t("anime.today")}: {data.count.today}</a>
          <a className="text-sm text-muted-foreground">{t("anime.week")}: {data.count.week}</a>
          <a className="text-sm text-muted-foreground">{t("anime.total")}: {data.count.total}</a>
        </div>
        {data.anime?.map((item, index) => (
          <Card key={index} className="flex flex-col">
            <CardContent className="flex gap-4 flex-1">
              {(data.config.cover_source === "anilist" ? item.cover_anilist || item.cover_bangumi : item.cover_bangumi || item.cover_anilist) ? (
                <img 
                  src={data.config.cover_source === "anilist" ? item.cover_anilist || item.cover_bangumi || null : item.cover_bangumi || item.cover_anilist || null}
                  className="min-w-20 max-w-20 min-h-28 max-h-28 rounded-md object-cover bg-muted"
                  onError={(e) => { e.target.src = "" }}
                />
              ) : (
                <div className="min-w-20 max-w-20 min-h-28 max-h-28 rounded-md bg-muted" />
              )}
              <div className="flex flex-col gap-2 my-1 w-fit">
                {item.rss_names && (
                  <div className="flex gap-2">
                    <Badge variant="outline">{new Date(item.pub_date).toLocaleString()}</Badge>
                    {item.rss_names.split(",").map((name, idx) => (
                      <Badge key={idx} variant="outline">{name}</Badge>
                    ))}
                  </div>
                )}
                <div className="w-fit">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <a href={item.torrent} target="_blank" className="font-medium hover:underline">
                          {getTitleByPriority(item, data.config.title_priority)}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="py-2 space-y-1">
                        {item.title_cn && <p><a className="font-bold">CN: </a>{item.title_cn}</p>}
                        {item.title_jp && <p><a className="font-bold">JP: </a>{item.title_jp}</p>}
                        {item.title_en && <p><a className="font-bold">EN: </a>{item.title_en}</p>}
                        {item.title_romaji && <p><a className="font-bold">Romaji: </a>{item.title_romaji}</p>}
                        {!item.title_cn && !item.title_jp && !item.title_en && !item.title_romaji && item.title_prased && <p><a className="font-bold">Title: </a>{item.title_prased}</p>}
                        {!item.title_cn && !item.title_jp && !item.title_en && !item.title_romaji && !item.title_prased && <p>{item.title_raw}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <a className="text-sm text-muted-foreground">{item.title}</a>
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
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("download", data.config.default_downloader, item.hash)} disabled={!data.config.default_downloader || data.config.default_downloader_online === "0"}>
                    <Download />{t("glb.download")}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <PaginationPro currentPage={currentPage} totalPages={Math.ceil(data.pagination.total / data.pagination.size)} onPageChange={handlePageChange} />
    </div>
  );
}
