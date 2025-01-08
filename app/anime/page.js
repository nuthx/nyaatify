"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast"
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Download, Pause, RefreshCcw, Trash2 } from "lucide-react";

export default function Anime() {
  const animeApi = "/api/anime";
  const torrentsApi = "/api/torrents";

  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast()
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [defaultServer, setDefaultServer] = useState(null);
  const [defaultServerOnline, setDefaultServerOnline] = useState(0);

  useEffect(() => {
    // Get initial page from URL on first render
    if (!currentPage) {
      const pageFromUrl = Number(searchParams.get("page")) || 1;
      setCurrentPage(pageFromUrl);
      return;
    }

    // Fetch data and update URL when currentPage changes
    fetchAnime(currentPage);
    if (currentPage > 1) {
      router.push(`/anime?page=${currentPage}`);
    } else {
      router.push("/anime");
    }
  }, [currentPage, searchParams, router]);

  const fetchAnime = async (page = 1) => {
    try {
      const response = await fetch(`${animeApi}?page=${page}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      if (data.anime.length === 0) {
        setError(t("anime.empty"));
        return;
      }

      setItems({
        list: data.anime,
        count: data.count
      });
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.size));
      setDefaultServer(data.default_server);
      setDefaultServerOnline(data.default_server_online);
      setError(null);
    } catch (error) {
      setError(`${t("anime.load_fail")}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async (action, server, hash) => {
    const result = await handlePost(torrentsApi, JSON.stringify({ action, server, hash }));
    if (result === "success") {
      if (action === "add") {
        toast({
          title: t(`download.toast.add_success`)
        });
      }
      fetchAnime(currentPage);
    } else {
      toast({
        title: t(`download.toast.${action}`),
        description: result,
        variant: "destructive"
      });
    }
  };

  const renderPageItem = (page, isActive = false) => (
    <PaginationItem key={page}>
      <PaginationLink className="cursor-pointer" onClick={() => setCurrentPage(page)} isActive={isActive}>
        {page}
      </PaginationLink>
    </PaginationItem>
  );

  const renderPageItems = (start, count) => (
    [...Array(count)].map((_, i) => renderPageItem(start + i, start + i === currentPage))
  );

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      {isLoading ? (
        <></>
      ) : error ? (
        <a className="text-sm text-center text-zinc-500">
          {error}
        </a>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex gap-4 mx-1 mb-2 col-span-1 md:col-span-2">
            {!defaultServer && <Badge variant="outline">{t("anime.no_server")}</Badge>}
            {defaultServer && defaultServerOnline === 0 && <Badge variant="destructive">{t("anime.server_offline")}</Badge>}
            <a className="text-sm text-zinc-500">{t("anime.today")}: {items.count.today}</a>
            <a className="text-sm text-zinc-500">{t("anime.week")}: {items.count.week}</a>
            <a className="text-sm text-zinc-500">{t("anime.total")}: {items.count.total}</a>
          </div>
          {items.list?.map((item, index) => (
            <Card key={index} className="flex flex-col">
              <CardContent className="flex gap-4 flex-1">
                <img 
                  key={`${item.cover_bangumi}-${currentPage}`}
                  src={item.cover_bangumi || null}
                  className="min-w-20 max-w-20 min-h-28 max-h-28 rounded-md object-cover bg-zinc-200"
                  onError={(e) => {
                    e.target.classList.remove("object-cover");
                    e.target.src = null;
                  }}
                />
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
                            {item.name_cn || item.name_jp || item.name_en || item.name_title || item.title}
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
                  <a className="text-sm text-zinc-500">{item.title}</a>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {item.server && <Badge>{t(`download.state.${item.server.state}`)}</Badge>}
                  <a className="text-sm text-zinc-500">{item.server ? `${item.server.completed} / ${item.server.size} (${item.server.progress === 1 ? 100 : (item.server.progress*100).toFixed(1)}%)` : item.size}</a>
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
                    <Button variant="outline" className="font-normal" onClick={() => handleManage("add", defaultServer, item.hash)} disabled={!defaultServer || defaultServerOnline === 0}>
                      <Download />{t("glb.download")}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && !error && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {totalPages > 7 ? (
              <>
                {currentPage <= 4 ? (
                  <>
                    {renderPageItems(1, 6)}
                    <PaginationEllipsis />
                    {renderPageItem(totalPages)}
                  </>
                ) : 
                currentPage > totalPages - 4 ? (
                  <>
                    {renderPageItem(1)}
                    <PaginationEllipsis />
                    {renderPageItems(totalPages - 5, 6)}
                  </>
                ) : 
                (
                  <>
                    {renderPageItem(1)}
                    <PaginationEllipsis />
                    {renderPageItems(currentPage - 2, 5)}
                    <PaginationEllipsis />
                    {renderPageItem(totalPages)}
                  </>
                )}
              </>
            ) : (
              renderPageItems(1, totalPages)
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
