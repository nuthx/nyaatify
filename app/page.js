"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"
import { Download, Pause, RefreshCcw, Trash2 } from "lucide-react";

export default function Home() {
  const animeApi = "/api/anime";

  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
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
      router.push(`?page=${currentPage}`);
    } else {
      router.push("/");
    }
  }, [currentPage, searchParams, router]);

  const fetchAnime = async (page = 1) => {
    try {
      const response = await fetch(`${animeApi}?page=${page}`);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setError(t("home.empty"));
        return;
      }
      
      setItems(data.data);
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.size));
      setError(null);
    } catch (error) {
      setError(`${t("home.load_fail")}: ${error.message}`);
    } finally {
      setIsLoading(false);
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
          <div className="flex gap-4 mx-1 mb-3">
            <a className="text-sm text-zinc-500">{t("home.today")}: 10</a>
            <a className="text-sm text-zinc-500">{t("home.week")}: 20</a>
            <a className="text-sm text-zinc-500">{t("home.total")}: 100</a>
          </div>
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="flex gap-4">
                <img 
                  key={`${item.cover_bangumi}-${currentPage}`}
                  src={item.cover_bangumi || null}
                  className="w-20 h-28 rounded-md object-cover bg-zinc-200"
                  onError={(e) => {
                    e.target.classList.remove('object-cover');
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
                    <a href={item.torrent} target="_blank" className="font-medium hover:underline">
                      {item.name_cn || item.name_jp || item.name_en || item.name_title}
                    </a>
                  </div>
                  <a className="text-sm text-zinc-500">{item.title}</a>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <StateIndicator state="new"/>
                  <a className="text-sm text-zinc-500">1.5GiB / {item.size}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="font-normal"><Download />{t("glb.download")}</Button>
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

export function StateIndicator({ state }) {
  const { t } = useTranslation();

  const stateConfig = {
    new: {
      color: "bg-purple-500",
      textColor: "text-zinc-500",
      label: "home.state.new"
    },
    downloading: {
      color: "bg-sky-500", 
      textColor: "text-sky-500",
      label: "home.state.downloading"
    },
    completed: {
      color: "bg-green-500",
      textColor: "text-green-500", 
      label: "home.state.completed"
    },
    paused: {
      color: "bg-amber-500",
      textColor: "text-amber-500",
      label: "home.state.paused"
    },
    failed: {
      color: "bg-red-500",
      textColor: "text-red-500",
      label: "home.state.failed"
    }
  };

  const config = stateConfig[state] || stateConfig.downloading;

  return (
    <div className="flex items-center gap-2 border px-2.5 py-1 border-zinc-200 rounded-full">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color}`}></div>
      <a className={`text-sm ${config.textColor}`}>{t(config.label)}</a>
    </div>
  );
}
