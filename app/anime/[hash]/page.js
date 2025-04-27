"use client";

import Image from "next/image";
import { toast } from "sonner"
import { use, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import { createForm } from "@/lib/form";
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
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LabelInput } from "@/components/label-input";
import { 
  SquareArrowOutUpRight, PencilLine,
  Download, Pause, Play, Trash2,
  FileDown, Link,
  CircleArrowUp, CircleArrowDown, Clock,
  Loader2, RefreshCcw,
} from "lucide-react";

export default function AnimeDetail({ params }) {
  const { t } = useTranslation();
  const { hash } = use(params);
  const [showAnilistCover, setShowAnilistCover] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reanalysisForm = createForm({
    anilist_id: { schema: "trim" },
    bangumi_id: { schema: "trim" }
  })();

  const { data: animeData, error: animeError, isLoading: animeLoading, mutate: animeMutate } = useData(`${API.ANIME}/${hash}`);
  const { data: descData, error: descError, isLoading: descLoading, mutate: descMutate } = useData(`${API.ANIME}/${hash}/desc`);
  const { data: torrentsData, error: torrentsError, isLoading: torrentsLoading, mutate: torrentsMutate } = useData(API.TORRENTS, null, { refreshInterval: 1000 });
  const { data: configData, error: configError, isLoading: configLoading } = useData(API.CONFIG);

  // Set page title
  useEffect(() => {
    if (!animeLoading) {
      if (animeData) {
        document.title = `${animeData.titleFirst} - Nyaatify`;
      } else {
        document.title = "404 - Nyaatify";
      }
    }
  }, [animeData, animeLoading]);

  // Set initial cover source based on config
  useEffect(() => {
    if (!configLoading && configData) {
      setShowAnilistCover(configData.animeCoverSource === "anilist");
    }
  }, [configData, configLoading]);

  const handleReanalysis = async (values) => {
    const result = await handleRequest("POST", `${API.ANIME}/${hash}/reanalysis`, values, t("toast.failed.edit"));
    if (result) {
      if (result.code === 240) {
        toast(t("toast.done.no_change"));
      } else {
        setDialogOpen(false);
        animeMutate();
        toast(t("toast.success.edit"));
        reanalysisForm.reset();
      }
    }
  };

  const handleManage = async (action, downloader, hash) => {
    const result = await handleRequest("POST", API.TORRENTS, { action, downloader, hash }, t(`toast.failed.${action}`));
    if (result) {
      torrentsMutate();
    }
  };

  if (animeLoading || configLoading || torrentsLoading) {
    return <></>;
  }

  // Show error message if request failed
  let errorMessage = "";
  if (animeError) {
    errorMessage = animeError.message;
  } else if (configError) {
    errorMessage = configError.message;
  } else if (torrentsError) {
    errorMessage = torrentsError.message;
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8 px-6 md:px-10">{errorMessage}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl py-8 px-6 md:px-10 flex flex-col gap-4">
      <Card>
        <CardHeader className="py-5">
          <CardTitle className="text-base/6">{animeData.titleRaw}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col md:items-center justify-center md:justify-start gap-6 md:gap-2 w-full md:w-auto">
              <div className="group relative min-w-40 max-w-40 min-h-56 max-h-56 rounded-md bg-muted overflow-hidden">
                {(animeData.coverAnilist || animeData.coverBangumi) && (
                  <>
                    <Image
                      src={showAnilistCover ? animeData.coverAnilist || animeData.coverBangumi : animeData.coverBangumi || animeData.coverAnilist}
                      alt={animeData.titleRaw}
                      fill
                      className="object-cover"
                      draggable="false"
                    />
                    {animeData.coverAnilist && animeData.coverBangumi && (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="float" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" onClick={() => setShowAnilistCover(!showAnilistCover)}>
                              <RefreshCcw className="w-6 h-6 text-white" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("anime.page.switch_to", { source: showAnilistCover ? "Bangumi" : "Anilist" })}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 pb-1">
                  {animeData.rss?.map((rss, idx) => (
                    <Badge key={idx} variant="outline">{rss.name}</Badge>
                  ))}
                </div>
                {configData.animeTitlePriority.split(",").map((type) => {
                  const titles = {
                    jp: { label: t("anime.page.title_jp"), value: animeData.titleJp },
                    cn: { label: t("anime.page.title_cn"), value: animeData.titleCn },
                    en: { label: t("anime.page.title_en"), value: animeData.titleEn },
                    romaji: { label: t("anime.page.title_romaji"), value: animeData.titleRomaji }
                  };
                  const title = titles[type];
                  return title.value ? (
                    <p key={type} className="text-sm"><span className="font-semibold">{title.label}: </span>{title.value}</p>
                  ) : null;
                })}
                {animeData.titleParsed && (
                  <p className="text-sm"><span className="font-semibold">{t("anime.page.title_parsed")}: </span>{animeData.titleParsed}</p>
                )}
              </div>
              <Separator />
              <div className="space-y-2.5">
                <p className="text-sm"><span className="font-semibold">{t("anime.page.size")}: </span>{animeData.size}</p>
                <p className="text-sm"><span className="font-semibold">{t("anime.page.pub_date")}: </span>{new Date(animeData.pubDate).toLocaleString()}</p>
                <p className="text-sm"><span className="font-semibold">{t("anime.page.created_at")}: </span>{new Date(animeData.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 py-3">
          <div className="flex gap-2 md:gap-3">
            <a href={`https://anilist.co/anime/${animeData.idAnilist}`} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent shadow-none"><SquareArrowOutUpRight />Anilist</Button>
            </a>
            <a href={`https://bgm.tv/subject/${animeData.idBangumi}`} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent shadow-none"><SquareArrowOutUpRight />Bangumi</Button>
            </a>
            <a href={animeData.sourceUrl} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent shadow-none"><SquareArrowOutUpRight />{animeData.source}</Button>
            </a>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent shadow-none">
                <PencilLine />{t("anime.page.reanalysis.title")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={reanalysisForm.handleSubmit(handleReanalysis)}>
                <DialogHeader>
                  <DialogTitle>{t("anime.page.reanalysis.title")}</DialogTitle>
                  <DialogDescription>{t("anime.page.reanalysis.desc")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <LabelInput form={reanalysisForm} title="Anilist ID" id="anilist_id" placeholder={animeData.idAnilist} type="number"/>
                  <LabelInput form={reanalysisForm} title="Bangumi ID" id="bangumi_id" placeholder={animeData.idBangumi} type="number"/>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("glb.cancel")}</Button>
                  <Button type="submit">{t("glb.confirm")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card>
        <CardContent>
          {(() => {
            const torrent = torrentsData.torrents?.find(t => t.hash === hash);
            return torrent ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{torrent.name}</p>
                <Progress value={torrent.progress * 100} />
                <div className="flex flex-col md:flex-row justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{t(`glb.torrent.${torrent.state}`)} | {torrent.completed} / {torrent.size} ({torrent.progress === 1 ? 100 : (torrent.progress*100).toFixed(1)}%)</p>
                  <div className="flex items-center gap-5">
                    <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground"><CircleArrowDown className="w-4 h-4" /> {torrent.dl_speed}/s</span>
                    <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground"><CircleArrowUp className="w-4 h-4" /> {torrent.up_speed}/s</span>
                    {Object.keys(torrent.eta_dict).length > 0 && (
                      <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {torrent.eta_dict.h ? `${torrent.eta_dict.h}:` : ""}
                        {torrent.eta_dict.m ? `${torrent.eta_dict.m}:` : ""}
                        {torrent.eta_dict.s ? `${torrent.eta_dict.s}s` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center m-6">
                <p className="text-sm text-muted-foreground">{t("anime.page.download.none")}</p>
              </div>
            );
          })()}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 py-3">
          <div className="flex gap-2 md:gap-3">
            {(() => {
              const torrent = torrentsData.torrents?.find(t => t.hash === hash);
              return torrent ? (
                <>
                  {torrent.state_class === "stalled" && (
                    <Button variant="outline" size="sm" className="bg-transparent shadow-none" onClick={() => handleManage("resume", torrent.downloader, torrent.hash)}>
                      <Play />{t("glb.resume")}
                    </Button>
                  )}
                  {torrent.state_class === "working" && (
                    <Button variant="outline" size="sm" className="bg-transparent shadow-none" onClick={() => handleManage("pause", torrent.downloader, torrent.hash)}>
                      <Pause />{t("glb.pause")}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-transparent shadow-none">
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
                        <AlertDialogAction onClick={() => handleManage("delete", torrent.downloader, torrent.hash)}>
                          {t("glb.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
                ) : (
                <Button variant="outline" size="sm" className="bg-transparent shadow-none" onClick={() => handleManage("download", configData.defaultDownloader, hash)}>
                  <Download />{t("glb.download")}
                </Button>
              );
            })()}
          </div>
          <div className="flex gap-2 md:gap-3">
            <a href={animeData.torrent} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent shadow-none"><FileDown />{t("anime.page.torrent_file")}</Button>
            </a>
            <a href={`magnet:?xt=urn:btih:${animeData.hash}&dn=${animeData.titleRaw}`} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent shadow-none"><Link />{t("anime.page.magnet_link")}</Button>
            </a>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("anime.page.pub.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {descLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 m-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("anime.page.pub.loading")}</p>
            </div>
          ) : descError ? (
            <div className="flex flex-col items-center justify-center gap-4 m-6">
              <p className="text-sm text-muted-foreground">{t("toast.failed.fetch_desc")}</p>
              <Button variant="outline" size="sm"onClick={() => descMutate()}><RefreshCcw />{t("glb.retry")}</Button>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: descData.content }}>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
