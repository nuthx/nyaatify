"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { Pause, RefreshCcw, Trash2 } from "lucide-react";

export default function Home() {
  const torrentsApi = "/api/torrents";

  const { t } = useTranslation();

  const { data: torrentsData, error: torrentsError, isLoading: torrentsLoading, mutate: mutateTorrents } = useData(torrentsApi, null, { refreshInterval: 1000 });

  // Set page title
  useEffect(() => {
    document.title = `${t("nav.downloads")} - Nyaatify`;
  }, [t]);

  const handleManage = async (action, downloader, hash) => {
    const result = await handleRequest("POST", torrentsApi, { action, downloader, hash }, t(`toast.failed.${action}`));
    if (result) {
      mutateTorrents();
    }
  };

  if (torrentsLoading) {
    return <></>;
  }

  // Show error message if request failed or no torrents
  let errorMessage = "";
  if (torrentsError) {
    errorMessage = torrentsError.message;
  } else if (torrentsData.downloaders === 0) {
    errorMessage = t("downloads.empty_downloader");
  } else if (torrentsData.online === 0) {
    errorMessage = t("downloads.empty_online");
  } else if (torrentsData.torrents.length === 0) {
    errorMessage = t("downloads.empty_torrents");
  }
  if (errorMessage) {
    return <a className="text-sm text-center text-muted-foreground flex flex-col py-8">{errorMessage}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      <div className="grid gap-3">
        {torrentsData.torrents.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t(`downloads.state.${item.state}`)}</Badge>
                <Badge variant="outline">{item.downloader}</Badge>
              </div>
              <a className="font-medium">{item.name}</a>
              <div className="flex items-center gap-2">
                <a className="w-1/6 text-sm text-muted-foreground">{t("downloads.d_speed")}: {item.dlspeed}/s</a>
                <a className="w-1/6 text-sm text-muted-foreground">{t("downloads.u_speed")}: {item.upspeed}/s</a>
                {item.eta !== 8640000 && <a className="w-2/6 text-sm text-muted-foreground">
                  {t("downloads.eta")}: {Math.floor(item.eta/86400) > 0 && `${Math.floor(item.eta/86400)} ${t("downloads.d")} `}
                  {Math.floor((item.eta%86400)/3600) > 0 && `${Math.floor((item.eta%86400)/3600)} ${t("downloads.h")} `}
                  {Math.floor((item.eta%3600)/60) > 0 && `${Math.floor((item.eta%3600)/60)} ${t("downloads.m")} `}
                  {item.eta%60 > 0 && `${item.eta%60} ${t("downloads.s")}`}
                </a>}
              </div>
            </CardContent>
            
            <CardFooter className="flex items-center justify-between py-4">
              <a className="text-sm text-muted-foreground">{item.completed} / {item.size} ({item.progress === 1 ? 100 : (item.progress*100).toFixed(1)}%)</a>
              <div className="flex items-center gap-2">
                {["uploading", "queuedUP", "stalledUP", "allocating", "downloading", "metaDL",
                  "queuedDL", "stalledDL", "checkingDL", "forcedDL", "checkingResumeData"].includes(item.state) && (
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("pause", item.downloader, item.hash)}>
                    <Pause />{t("glb.pause")}
                  </Button>
                )}
                {["pausedUP", "pausedDL", "stoppedUP", "stoppedDL"].includes(item.state) && (
                  <Button className="font-normal" onClick={() => handleManage("resume", item.downloader, item.hash)}>
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
                      <AlertDialogAction onClick={() => handleManage("delete", item.downloader, item.hash)}>
                        {t("glb.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
            <Progress 
              value={item.progress*100} 
              className="h-1 rounded-none bg-transparent [&>div]:bg-emerald-500"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
