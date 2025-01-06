"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"
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

      if (data.data.length === 0) {
        setError(t("anime.empty"));
        return;
      }

      setItems({
        list: data.data,
        count: data.count
      });
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.size));
      setError(null);
    } catch (error) {
      setError(`${t("anime.load_fail")}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async (action, server, hash) => {
    try {
      const response = await fetch(torrentsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          server: server,
          hash: hash
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t(`download.toast.add_success`)
        });
        fetchAnime(currentPage);
      } else {
        toast({
          title: t(`download.toast.${action}`),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t(`download.toast.${action}`),
        description: error.message,
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
        <div className="grid gap-3">
          <div className="flex gap-4 mx-1 mb-2">
            <a className="text-sm text-zinc-500">{t("anime.today")}: {items.count.today}</a>
            <a className="text-sm text-zinc-500">{t("anime.week")}: {items.count.week}</a>
            <a className="text-sm text-zinc-500">{t("anime.total")}: {items.count.total}</a>
          </div>
          {items.list?.map((item, index) => (
            <Card key={index}>
              <CardContent className="flex gap-4">
                <img 
                  key={`${item.cover_bangumi}-${currentPage}`}
                  src={item.cover_bangumi || null}
                  className="w-20 h-28 rounded-md object-cover bg-zinc-200"
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
                        <TooltipTrigger>
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
                  <Button variant="outline" className="font-normal" onClick={() => handleManage("add", "本地测试服务器", item.hash)}>
                    <Download />{t("glb.download")}
                  </Button>
                  <Button variant="outline" className="font-normal"><Pause />{t("glb.pause")}</Button>
                  <Button variant="outline" className="font-normal"><RefreshCcw />{t("glb.resume")}</Button>
                  <Button variant="outline" className="font-normal"><Trash2 />{t("glb.cancel")}</Button>
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
