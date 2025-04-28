"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, Trash2, CircleArrowUp, CircleArrowDown, Clock } from "lucide-react";

export default function Downloads() {
  const { t } = useTranslation();

  const { data: torrentsData, error: torrentsError, isLoading: torrentsLoading, mutate: torrentsMutate } = useData(API.TORRENTS, null, { refreshInterval: 1000 });

  // Set page title
  useEffect(() => {
    document.title = `${t("nav.downloads")} - Nyaatify`;
  }, [t]);

  const handleManage = async (action, downloader, hash) => {
    const result = await handleRequest("POST", API.TORRENTS, { action, downloader, hash }, t(`toast.failed.${action}`));
    if (result) {
      torrentsMutate();
    }
  };

  if (torrentsLoading) {
    return <></>;
  }

  // Show error message if request failed or no torrents
  let errorMessage = "";
  if (torrentsError) {
    errorMessage = torrentsError.message;
  } else if (torrentsData.downloaders.length === 0) {
    errorMessage = t("downloads.empty_downloader");
  } else if (torrentsData.online.length === 0) {
    errorMessage = t("downloads.empty_online");
  } else if (torrentsData.torrents.length === 0) {
    errorMessage = t("downloads.empty_torrents");
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8 px-6 md:px-10">{errorMessage}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col gap-4 px-6 md:px-10 py-8">
      {torrentsData?.torrents.map((torrent, index) => (
        <TorrentCard 
          key={index}
          torrent={torrent}
          handleManage={handleManage}
        />
      ))}
    </div>
  );
}

function TorrentCard({ torrent, handleManage }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{torrent.name}</p>

        <Progress 
          value={torrent.progress * 100} 
          className={`h-1.5 transition-all duration-300 ease-in-out ${
            torrent.state_class === "working" 
              ? "[&>div]:bg-cyan-700" 
              : "[&>div]:bg-primary/30"
          }`}
        />

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
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3 py-3">
        <div className="flex gap-2">
          {torrent.state_class === "working" && (
            <Badge className="bg-cyan-700">{t(`glb.torrent.${torrent.state}`)}</Badge>
          )}
          {torrent.state_class === "stalled" && (
            <Badge variant="outline" className="text-red-700/80 border-red-700/40">{t(`glb.torrent.${torrent.state}`)}</Badge>
          )}
          <Badge variant="outline">{torrent.downloader}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-transparent shadow-none" onClick={() => handleManage("resume", torrent.downloader, torrent.hash)}>
            <Play />{t("glb.continue")}
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent shadow-none" onClick={() => handleManage("pause", torrent.downloader, torrent.hash)}>
            <Pause />{t("glb.pause")}
          </Button>
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
        </div>
      </CardFooter>
    </Card>
  );
}
