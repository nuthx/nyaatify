"use client";

import useSWR from "swr"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next";
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pause, RefreshCcw, Trash2 } from "lucide-react";

export default function Home() {
  const torrentsApi = "/api/torrents";

  const { t } = useTranslation();
  const { toast } = useToast()

  const { data, error, isLoading, mutate } = useSWR(torrentsApi, async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    if (data.servers === 0) {
      throw new Error(t("download.empty_server"));
    }
    if (data.online === 0) {
      throw new Error(t("download.empty_online"));
    }
    if (data.torrents.length === 0) {
      throw new Error(t("download.empty_torrents"));
    }
    return data;
  }, { refreshInterval: 2000 });

  const handleManage = async (action, server, hash) => {
    const result = await handlePost(torrentsApi, JSON.stringify({ action, server, hash }));
    if (result.state === "success") {
      mutate();
    } else {
      toast({
        title: t(`toast.failed.${action}`),
        description: result.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <a className="text-sm text-center text-zinc-500 flex flex-col py-8">{error.message}</a>
  }

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      <div className="grid gap-3">
        {data.torrents.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t(`download.state.${item.state}`)}</Badge>
                <Badge variant="outline">{item.server}</Badge>
              </div>
              <a className="font-medium">{item.name}</a>
              <div className="flex items-center gap-2">
                <a className="w-1/6 text-sm text-zinc-500">{t("download.d_speed")}: {item.dlspeed}/s</a>
                <a className="w-1/6 text-sm text-zinc-500">{t("download.u_speed")}: {item.upspeed}/s</a>
                {item.eta !== 8640000 && <a className="w-2/6 text-sm text-zinc-500">
                  {t("download.eta")}: {Math.floor(item.eta/86400) > 0 && `${Math.floor(item.eta/86400)} ${t("download.d")} `}
                  {Math.floor((item.eta%86400)/3600) > 0 && `${Math.floor((item.eta%86400)/3600)} ${t("download.h")} `}
                  {Math.floor((item.eta%3600)/60) > 0 && `${Math.floor((item.eta%3600)/60)} ${t("download.m")} `}
                  {item.eta%60 > 0 && `${item.eta%60} ${t("download.s")}`}
                </a>}
              </div>
            </CardContent>
            
            <CardFooter className="flex items-center justify-between py-4">
              <a className="text-sm text-zinc-500">{item.completed} / {item.size} ({item.progress === 1 ? 100 : (item.progress*100).toFixed(1)}%)</a>
              <div className="flex items-center gap-2">
                {["uploading", "queuedUP", "stalledUP", "allocating", "downloading", "metaDL",
                  "queuedDL", "stalledDL", "checkingDL", "forcedDL", "checkingResumeData"].includes(item.state) && (
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("pause", item.server, item.hash)}>
                    <Pause />{t("glb.pause")}
                  </Button>
                )}
                {["pausedUP", "pausedDL", "stoppedUP", "stoppedDL"].includes(item.state) && (
                  <Button className="font-normal" onClick={() => handleManage("resume", item.server, item.hash)}>
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
                      <AlertDialogAction onClick={() => handleManage("delete", item.server, item.hash)}>
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
