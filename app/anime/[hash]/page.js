"use client";

import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PenLine, Download, Pause, RefreshCcw, Trash2, File, Link, SquareArrowOutUpRight } from "lucide-react";

export default function AnimeDetail({ params }) {
  const { t } = useTranslation();
  const { hash } = use(params);
  const [showAnilist, setShowAnilist] = useState(false);

  const { data: animeData, error: animeError, isLoading: animeLoading } = useData(`${API.ANIME}/${hash}`);
  const { data: configData, error: configError, isLoading: configLoading } = useData(`${API.CONFIG}`);

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
      setShowAnilist(configData.animeCoverSource === "anilist");
    }
  }, [configData, configLoading]);

  if (animeLoading || configLoading) {
    return <></>;
  }

  // Show error message if request failed
  let errorMessage = "";
  if (animeError) {
    errorMessage = animeError.message;
  } else if (configError) {
    errorMessage = configError.message;
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8 px-6 md:px-10">{errorMessage}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl py-8 px-6 md:px-10 flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base/6">{animeData.titleRaw}</CardTitle>
          <Button variant="ghost" size="icon" className="shrink-0 m-0"><PenLine /></Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="group relative min-w-40 max-w-40 min-h-56 max-h-56 rounded-md bg-muted overflow-hidden">
              {(animeData.coverAnilist || animeData.coverBangumi) && (
                <>
                  <Image
                    src={showAnilist ? animeData.coverAnilist || animeData.coverBangumi : animeData.coverBangumi || animeData.coverAnilist}
                    alt={animeData.titleRaw}
                    fill
                    className="object-cover"
                    draggable="false"
                  />
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="float" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" onClick={() => setShowAnilist(!showAnilist)}>
                          <RefreshCcw className="w-6 h-6 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("anime.page.switch_to", { source: showAnilist ? "Bangumi" : "Anilist" })}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <p><span className="font-semibold">{t("anime.page.title_jp")}: </span>{animeData.titleJp}</p>
                <p><span className="font-semibold">{t("anime.page.title_cn")}: </span>{animeData.titleCn}</p>
                <p><span className="font-semibold">{t("anime.page.title_en")}: </span>{animeData.titleEn}</p>
                <p><span className="font-semibold">{t("anime.page.title_romaji")}: </span>{animeData.titleRomaji}</p>
                <p><span className="font-semibold">{t("anime.page.title_parsed")}: </span>{animeData.titleParsed}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("anime.page.rss")}: </span>
                  {animeData.rss?.map((rss, idx) => (
                    <Badge key={idx} variant="outline">{rss.name}</Badge>
                  ))}
                </div>
                <p><span className="font-semibold">{t("anime.page.size")}: </span>{animeData.size}</p>
                <p><span className="font-semibold">{t("anime.page.pub_date")}: </span>{new Date(animeData.pubDate).toLocaleString()}</p>
                <p><span className="font-semibold">{t("anime.page.created_at")}: </span>{new Date(animeData.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <div className="flex gap-2">
            <a href={`https://anilist.co/anime/${animeData.idAnilist}`} target="_blank">
              <Button variant="outline"><SquareArrowOutUpRight />Anilist</Button>
            </a>
            <a href={`https://bgm.tv/subject/${animeData.idBangumi}`} target="_blank">
              <Button variant="outline"><SquareArrowOutUpRight />Bangumi</Button>
            </a>
            <a href={animeData.sourceUrl} target="_blank">
              <Button variant="outline"><SquareArrowOutUpRight />{animeData.source}</Button>
            </a>
          </div>
          <div className="flex gap-2">
            <a href={animeData.torrent} target="_blank">
              <Button variant="outline"><File />{t("anime.page.torrent_file")}</Button>
            </a>
            <a href={`magnet:?xt=urn:btih:${animeData.hash}&dn=${animeData.titleRaw}`} target="_blank">
              <Button variant="outline"><Link />{t("anime.page.magnet_link")}</Button>
            </a>
            <Separator orientation="vertical" className="h-8" />
            <a href={`magnet:?xt=urn:btih:${animeData.hash}&dn=${animeData.titleRaw}`} target="_blank">
              <Button variant="outline"><Download />{t("glb.download")}</Button>
            </a>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("anime.page.pub_info")}</CardTitle>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    </div>
  );
}
