"use client";

import useSWR from "swr";
import { toast } from "sonner"
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { handlePost } from "@/lib/handlers";
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
  const [currentPage, setCurrentPage] = useState(Number(useSearchParams().get("page")) || 1);

  const { data, error, isLoading, mutate } = useSWR(`${animeApi}?page=${currentPage}`, async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    if (data.anime.length === 0) {
      throw new Error(t("anime.empty"));
    }
    return data;
  });

  // To show url address with correct page
  // If first page, hide page number
  useEffect(() => {
    if (currentPage > 1) {
      router.push(`/anime?page=${currentPage}`);
    } else {
      router.push("/anime");
    }
  }, [currentPage, router]);

  const handleManage = async (action, server, hash) => {
    const result = await handlePost(torrentsApi, JSON.stringify({ action, server, hash }));
    if (result.state === "success") {
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
          if (item.name_jp) return item.name_jp;
          break;
        case "romaji":
          if (item.name_romaji) return item.name_romaji;
          break;
        case "cn":
          if (item.name_cn) return item.name_cn;
          break;
        case "en":
          if (item.name_en) return item.name_en;
          break;
      }
    }
    return item.name_title || item.title;
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
          {data.config.show_server_state === "1" && !data.config.default_server && <Badge variant="outline">{t("anime.no_server")}</Badge>}
          {data.config.show_server_state === "1" && data.config.default_server && data.config.default_server_online === "0" && <Badge variant="destructive">{t("anime.server_offline")}</Badge>}
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
                        {item.name_cn && <p><a className="font-bold">CN: </a>{item.name_cn}</p>}
                        {item.name_jp && <p><a className="font-bold">JP: </a>{item.name_jp}</p>}
                        {item.name_en && <p><a className="font-bold">EN: </a>{item.name_en}</p>}
                        {item.name_romaji && <p><a className="font-bold">Romaji: </a>{item.name_romaji}</p>}
                        {!item.name_cn && !item.name_jp && !item.name_en && !item.name_romaji && item.name_title && <p><a className="font-bold">Title: </a>{item.name_title}</p>}
                        {!item.name_cn && !item.name_jp && !item.name_en && !item.name_romaji && !item.name_title && <p>{item.title}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <a className="text-sm text-muted-foreground">{item.title}</a>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {item.server && <Badge>{t(`download.state.${item.server.state}`)}</Badge>}
                <a className="text-sm text-muted-foreground">{item.server ? `${item.server.completed} / ${item.server.size} (${item.server.progress === 1 ? 100 : (item.server.progress*100).toFixed(1)}%)` : item.size}</a>
              </div>
              <div className="flex items-center gap-2">
                {item.server? (
                  <>
                    {["uploading", "queuedUP", "stalledUP", "allocating", "downloading", "metaDL",
                      "queuedDL", "stalledDL", "checkingDL", "forcedDL", "checkingResumeData"].includes(item.server.state) && (
                      <Button variant="outline" className="font-normal" onClick={() => handleManage("pause", item.server.name, item.hash)}>
                        <Pause />{t("glb.pause")}
                      </Button>
                    )}
                    {["pausedUP", "pausedDL", "stoppedUP", "stoppedDL"].includes(item.server.state) && (
                      <Button className="font-normal" onClick={() => handleManage("resume", item.server.name, item.hash)}>
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
                            {t("download.alert")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("glb.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleManage("delete", item.server.name, item.hash)}>
                            {t("glb.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("download", data.config.default_server, item.hash)} disabled={!data.config.default_server || data.config.default_server_online === "0"}>
                    <Download />{t("glb.download")}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <PaginationPro currentPage={currentPage} totalPages={Math.ceil(data.pagination.total / data.pagination.size)} onPageChange={setCurrentPage} />
    </div>
  );
}

