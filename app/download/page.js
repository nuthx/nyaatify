"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const torrentsApi = "/api/torrent";

  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTorrents();

    // Set interval to fetch torrent list every 3 seconds
    const pollingInterval = setInterval(() => {
      fetchTorrents();
    }, 3000);

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
            <Card key={index}>
              <CardContent>
                {item.name}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
