"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"
import { Pause, RefreshCcw, Trash2 } from "lucide-react";

export default function Home() {
  const torrentsApi = "/api/torrent";

  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTorrents();

    // Set interval to fetch torrent list every 2 seconds
    const pollingInterval = setInterval(() => {
      fetchTorrents();
    }, 2000);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchTorrents = async () => {
    try {
      const response = await fetch(torrentsApi);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setError(t("download.empty"));
        return;
      }

      setItems(data.data);
      setError(null);
    } catch (error) {
      setError(`${t("download.load_fail")}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      {isLoading ? (
        <></>
      ) : error ? (
        <a className="text-sm text-center text-zinc-500">
          {error}
        </a>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
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
                  <Button variant="outline" className="font-normal"><Pause />{t("glb.pause")}</Button>
                  <Button variant="outline" className="font-normal"><RefreshCcw />{t("glb.resume")}</Button>
                  <Button variant="outline" className="font-normal"><Trash2 />{t("glb.delete")}</Button>
                </div>
              </CardFooter>
              <Progress 
                value={item.progress*100} 
                className="h-1 rounded-none bg-transparent [&>div]:bg-emerald-500"
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
