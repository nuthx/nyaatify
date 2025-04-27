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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedRss, setSelectedRss] = useState(searchParams.get("rss") || "all");

  const { data: animeData, error: animeError, isLoading: animeLoading } = useData(
    `${API.ANIME}?page=${currentPage}&rss=${selectedRss === "all" ? "" : selectedRss}`
  );
  const { data: configData, error: configError, isLoading: configLoading } = useData(API.CONFIG);
  const { data: torrentsData, error: torrentsError, isLoading: torrentsLoading, mutate: mutateTorrents } = useData(API.TORRENTS);

  // Set page title
  useEffect(() => {
    document.title = `${t("nav.anime")} - Nyaatify`;
  }, [t]);

  // Update URL when page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page);
    } else {
      params.delete("page");
    }
    router.push(`/anime${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Update URL when RSS changes
  const handleRssChange = (value) => {
    setSelectedRss(value);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("rss");
    } else {
      params.set("rss", value);
    }
    params.delete("page");
    router.push(`/anime${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleManage = async (action, downloader, hash) => {
    const result = await handleRequest("POST", API.TORRENTS, { action, downloader, hash }, t(`toast.failed.${action}`));
    if (result) {
      if (action === "download") {
        toast(t(`toast.start.download`));
      }
      mutateTorrents();
    }
  };

  if (animeLoading || configLoading || torrentsLoading) {
    return <></>;
  }

  // Show error message if request failed or no anime
  let errorMessage = "";
  if (animeError) {
    errorMessage = animeError.message;
  } else if (configError) {
    errorMessage = configError.message;
  } else if (torrentsError) {
    errorMessage = torrentsError.message;
  } else if (animeData.anime.length === 0 && selectedRss === "all") {
    errorMessage = t("anime.empty_rss");
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8 px-6 md:px-10">{errorMessage}</a>
  }

  // Combine anime data with torrents data
  const combinedData = animeData.anime.map(item => {
    const matchingTorrent = torrentsData.torrents.find(t => t.hash.toLowerCase() === item.hash.toLowerCase());
    return {
      ...item,
      downloader: matchingTorrent ? {
        name: matchingTorrent.downloader,
        state: matchingTorrent.state,
        progress: matchingTorrent.progress,
        completed: matchingTorrent.completed,
        size: matchingTorrent.size
      } : null
    };
  });

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6 px-6 md:px-10">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div className="flex gap-4">
          {configData.downloaderStateDisplay === "1" && (
            torrentsData.downloaders.length === 0 ? (
              <Badge variant="outline">{t("anime.no_downloader")}</Badge>
            ) : !torrentsData.online.includes(configData.defaultDownloader) && (
              <Badge variant="destructive">{t("anime.downloader_offline")}</Badge>
            )
          )}
          <a className="text-sm text-muted-foreground">{t("anime.today")}: {animeData.count.today}</a>
          <a className="text-sm text-muted-foreground">{t("anime.week")}: {animeData.count.week}</a>
          <a className="text-sm text-muted-foreground">{t("anime.total")}: {animeData.count.total}</a>
        </div>

        <Select defaultValue={selectedRss} onValueChange={handleRssChange}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("glb.all")}</SelectItem>
            {animeData.rss.list.map((rss, idx) => (
              <SelectItem key={idx} value={rss}>{rss}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {animeData.anime.length ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {combinedData.map((item, index) => (
              <AnimeCard
                key={index}
                item={item}
                configData={configData}
                torrentsData={torrentsData}
                handleManage={handleManage}
              />
            ))}
          </div>
          <PaginationPro 
            currentPage={currentPage} 
            totalPages={Math.ceil(animeData.pagination.total / animeData.pagination.size)} 
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <p className="my-8 text-sm text-center text-muted-foreground col-span-1 md:col-span-2">
          {t("anime.empty_anime")}
        </p>
      )}
    </div>
  );
}

function AnimeCard({ item, configData, torrentsData, handleManage }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col">
      <CardContent className="flex gap-4 flex-1">
        <div className="relative min-w-20 max-w-20 min-h-28 max-h-28 rounded-md bg-muted overflow-hidden">
          {(item.coverAnilist || item.coverBangumi) && (
            <Image
              src={configData.animeCoverSource === "anilist"
                ? (item.coverAnilist || item.coverBangumi)
                : (item.coverBangumi || item.coverAnilist)}
              alt={item.titleRaw}
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
                  <a href={`/anime/${item.hash}`} className="font-medium hover:underline">{item.titleFirst}</a>
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
            <Button variant="outline" className="font-normal" onClick={() => handleManage("download", configData.defaultDownloader, item.hash)} disabled={!configData.defaultDownloader || !torrentsData.online.includes(configData.defaultDownloader)}>
              <Download />{t("glb.download")}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
